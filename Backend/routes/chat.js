import express from "express";
import { db } from "../database.js";
import { runInteractionsChatLoop } from "../services/geminiService.js";
import { chatbotLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Cache-Aside with 5-minute TTL to optimize latency (<20ms) and preserve Gemini Free Tier Quota
const queryResponseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedResponse(cacheKey) {
  const cached = queryResponseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    queryResponseCache.delete(cacheKey);
    return null;
  }
  return cached.data;
}

function setCachedResponse(cacheKey, data) {
  if (queryResponseCache.size > 500) {
    const firstKey = queryResponseCache.keys().next().value;
    queryResponseCache.delete(firstKey);
  }
  queryResponseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

// In-Memory Cache for CMS Settings & Admin Redeem Codes (60s TTL) to eliminate Sydney DB roundtrips
let cachedCmsData = null;
let cachedCmsExpiresAt = 0;

async function getAdminCmsSettings() {
  const now = Date.now();
  if (cachedCmsData && now < cachedCmsExpiresAt) {
    return cachedCmsData;
  }
  try {
    const [cmsCountdown, allCodes] = await Promise.all([
      db.cmsSettings.findUnique({ where: { key: "launch_countdown" } }).catch(() => null),
      db.redeemCodes.findMany().catch(() => [])
    ]);

    const activeRedeemCodes = Array.isArray(allCodes)
      ? allCodes.filter(c => {
          if (!c.isActive) return false;
          if (c.expiryDate && new Date(c.expiryDate) < new Date()) return false;
          if (c.usageLimit && (c.usedCount || 0) >= c.usageLimit) return false;
          return true;
        })
      : [];

    cachedCmsData = { cmsCountdown, activeRedeemCodes };
    cachedCmsExpiresAt = now + 60 * 1000;
    return cachedCmsData;
  } catch (e) {
    return cachedCmsData || { cmsCountdown: null, activeRedeemCodes: [] };
  }
}

// Input normalizer to safely handle any request shape ({ message }, { userMessage }, { actionValue, userLabel, query })
export function normalizeUserMessage(body = {}) {
  const raw = body.userMessage || body.message || body.query || body.userLabel || body.actionValue || "";
  return String(raw)
    .trim()
    .substring(0, 1000)
    .replace(/[\x00-\x1F\x7F]/g, ""); // strip control characters
}

// ── GET /api/chat/session/:sessionId/messages ────────────────────────────────
// Reload chat history when widget reopens
router.get("/session/:sessionId/messages", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await db.chatSession?.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    }).catch(() => null);

    if (!session) {
      return res.status(404).json({ error: "Chat session not found." });
    }

    const messages = session.messages.map((m) => ({
      id: m.id,
      sender: m.role === "user" ? "user" : "bot",
      text: m.content,
      toolCalls: m.toolCalls,
      timestamp: m.createdAt.toISOString()
    }));

    res.json({
      success: true,
      sessionId: session.id,
      messages
    });
  } catch (err) {
    console.error("Get session messages error:", err);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

// ── POST /api/chat & /api/chat/message — Gemini Interactions API Endpoint ────
const handleChatMessage = async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
  let { sessionId, userId } = req.body || {};

  // Normalize user message from any request payload shape
  const userText = normalizeUserMessage(req.body);

  if (!userText) {
    return res.status(400).json({
      error: "Message content cannot be empty."
    });
  }

  try {
    let session = null;

    // Retrieve or create DB session
    if (sessionId && db.chatSession) {
      try {
        session = await db.chatSession.findUnique({ where: { id: sessionId } });
      } catch (e) {
        session = null;
      }
    }

    if (!session && db.chatSession) {
      try {
        session = await db.chatSession.create({
          data: {
            userId: userId || undefined,
            status: "ACTIVE"
          }
        });
      } catch (e) {
        session = null;
      }
    }

    // Guaranteed fallback if DB operation failed or table/model missing
    if (!session || !session.id) {
      session = { id: sessionId || `sess-${Date.now()}`, lastInteractionId: null };
    }

    sessionId = session.id;

    // Load active CMS launch countdown and admin redeem codes (cached in-memory for 60s)
    const { cmsCountdown, activeRedeemCodes } = await getAdminCmsSettings();

    const adminSaleCode = (typeof req.body?.saleDiscountCode === "string" && req.body.saleDiscountCode.trim())
      ? req.body.saleDiscountCode.trim()
      : (typeof cmsCountdown?.saleDiscountCode === "string" && cmsCountdown.saleDiscountCode.trim())
        ? cmsCountdown.saleDiscountCode.trim()
        : null;

    const adminHighlight = req.body?.saleDiscountHighlight || cmsCountdown?.saleDiscountHighlight || "Special Atelier Offer";

    const actionValue = req.body?.actionValue;
    const userLabel = req.body?.userLabel;
    const targetKey = actionValue || userLabel;

    // Quick Action & Interactive Pill Dispatcher
    const QUICK_ACTION_MAP = {
      myself: {
        reply: "Welcome. Let's find a piece tailored to your personal aesthetic. What category are you shopping for?",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Not sure yet", value: "All" }
        ]
      },
      "Find a piece for myself": {
        reply: "Welcome. Let's find a piece tailored to your personal aesthetic. What category are you shopping for?",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Not sure yet", value: "All" }
        ]
      },
      gift: {
        reply: "Gifting at VRIX is curated with intention. Who are you finding a gift for?",
        options: [
          { label: "Partner", value: "Partner" },
          { label: "Parent", value: "Parent" },
          { label: "Friend", value: "Friend" },
          { label: "Myself", value: "myself" }
        ]
      },
      "Find a gift": {
        reply: "Gifting at VRIX is curated with intention. Who are you finding a gift for?",
        options: [
          { label: "Partner", value: "Partner" },
          { label: "Parent", value: "Parent" },
          { label: "Friend", value: "Friend" },
          { label: "Myself", value: "myself" }
        ]
      },
      collections: {
        reply: "Select a signature collection category to explore:",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Bespoke", value: "Bespoke" }
        ]
      },
      "Explore collections": {
        reply: "Select a signature collection category to explore:",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Bespoke", value: "Bespoke" }
        ]
      },
      discovery: {
        reply: "Explore our collection by style or price preference. What are you looking for?",
        options: [
          { label: "Minimal & Everyday", value: "Minimal" },
          { label: "Solitaire Diamonds", value: "Solitaire" },
          { label: "Under ₹15,000", value: "15000" },
          { label: "18K Gold Vermeil", value: "Vermeil" }
        ]
      },
      compare: {
        reply: "Which pieces would you like to compare side-by-side?",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      education: {
        reply: "What would you like to explore about our materials and craftsmanship?",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Ethical Sourcing", value: "Sourcing" },
          { label: "Metal Purity Guide", value: "Metals" }
        ]
      },
      launch_date: {
        reply: "The VRIX digital atelier arrives soon. Enter your email below to receive private early access before public unveiling, or connect with our atelier on Instagram and Facebook for daily reveals:",
        emailCollector: {
          placeholder: "Enter your email for early invite...",
          buttonText: "Notify Me"
        },
        socialLinks: {
          title: "Follow VRIX Atelier",
          description: "Follow @vrix.official for inaugural solitaire previews & launch stories.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280"
        },
        options: [
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "Instagram & Facebook", value: "social_channels" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      "When is the Launch?": {
        reply: "The VRIX digital atelier arrives soon. Enter your email below to receive private early access before public unveiling, or connect with our atelier on Instagram and Facebook for daily reveals:",
        emailCollector: {
          placeholder: "Enter your email for early invite...",
          buttonText: "Notify Me"
        },
        socialLinks: {
          title: "Follow VRIX Atelier",
          description: "Follow @vrix.official for inaugural solitaire previews & launch stories.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280"
        },
        options: [
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "Instagram & Facebook", value: "social_channels" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      launch_waitlist: {
        reply: "Join our private VIP waitlist to receive priority access to our inaugural lab diamond drop before the public launch:",
        emailCollector: {
          placeholder: "Enter your email address...",
          buttonText: "Join VIP List"
        },
        options: [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Instagram & Facebook", value: "social_channels" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      "Join VIP Waitlist": {
        reply: "Join our private VIP waitlist to receive priority access to our inaugural lab diamond drop before the public launch:",
        emailCollector: {
          placeholder: "Enter your email address...",
          buttonText: "Join VIP List"
        },
        options: [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Instagram & Facebook", value: "social_channels" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      social_channels: {
        reply: "Stay connected across our official digital ateliers. We publish daily craftsmanship stories, educational reels, and unveiling announcements on Instagram and Facebook:",
        socialLinks: {
          title: "VRIX Official Channels",
          description: "Follow @vrix.official for inaugural solitaire previews & launch stories.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280"
        },
        options: [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      "Instagram & Facebook": {
        reply: "Stay connected across our official digital ateliers. We publish daily craftsmanship stories, educational reels, and unveiling announcements on Instagram and Facebook:",
        socialLinks: {
          title: "VRIX Official Channels",
          description: "Follow @vrix.official for inaugural solitaire previews & launch stories.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280"
        },
        options: [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ]
      },
      sale_details: {
        reply: adminSaleCode
          ? `The Private Archive Event is currently active across our atelier. Enjoy ${adminHighlight} across signature lab diamond solitaires, minimal rings, and pavé bands with official promo code ${adminSaleCode}.`
          : `The Private Archive Event is currently active across our atelier. Enjoy ${adminHighlight} across signature lab diamond solitaires, minimal rings, and pavé bands. No promo code is required — promotional atelier pricing is automatically applied at checkout.`,
        saleDiscountCard: {
          highlight: adminHighlight,
          code: adminSaleCode || undefined,
          description: cmsCountdown?.saleDescription || "Limited-time atelier pricing across selected solitaires, minimal rings, and pavé bands.",
          ctaUrl: cmsCountdown?.saleCtaUrl || "/collections"
        },
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      "Sale Details": {
        reply: adminSaleCode
          ? `The Private Archive Event is currently active across our atelier. Enjoy ${adminHighlight} across signature lab diamond solitaires, minimal rings, and pavé bands with official promo code ${adminSaleCode}.`
          : `The Private Archive Event is currently active across our atelier. Enjoy ${adminHighlight} across signature lab diamond solitaires, minimal rings, and pavé bands. No promo code is required — promotional atelier pricing is automatically applied at checkout.`,
        saleDiscountCard: {
          highlight: adminHighlight,
          code: adminSaleCode || undefined,
          description: cmsCountdown?.saleDescription || "Limited-time atelier pricing across selected solitaires, minimal rings, and pavé bands.",
          ctaUrl: cmsCountdown?.saleCtaUrl || "/collections"
        },
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      warranty: {
        reply: "VRIX provides lifetime craftsmanship warranty on all pieces. How can we assist you?",
        options: [
          { label: "Jewelry Care Guide", value: "Care" },
          { label: "Submit Repair Request", value: "Repair" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      Necklaces: {
        reply: "Explore architectural VRIX necklaces crafted with lab-grown solitaires and fine gold/silver finishes:",
        filterType: "Necklaces",
        options: [
          { label: "Compare these pieces", value: "compare" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Earrings: {
        reply: "Explore VRIX earrings — minimal studs, sculptural hoops, and drops designed for daily elegance:",
        filterType: "Earrings",
        options: [
          { label: "Compare these pieces", value: "compare" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Rings: {
        reply: "Explore VRIX solitaire rings and minimal bands featuring conflict-free lab diamonds:",
        filterType: "Rings",
        options: [
          { label: "Compare these pieces", value: "compare" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Bracelets: {
        reply: "Explore VRIX bracelets and cuffs designed for tactile weight and daily comfort:",
        filterType: "Bracelets",
        options: [
          { label: "Compare these pieces", value: "compare" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Partner: {
        reply: "Here are curated gift recommendations perfect for your partner, complete with signature packaging:",
        options: [
          { label: "Under ₹15,000", value: "15000" },
          { label: "Explore all collections", value: "collections" }
        ]
      },
      Parent: {
        reply: "Timeless, elegant pieces crafted for parents — thoughtful gifts meant to honor lasting memories:",
        options: [
          { label: "Explore all collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      Friend: {
        reply: "Modern, minimalist everyday jewelry perfect for celebrating friendship and special moments:",
        options: [
          { label: "Explore all collections", value: "collections" }
        ]
      },
      Care: {
        reply: "VRIX Jewelry Care Guide:\n• Store pieces separately in the provided soft linen pouch.\n• Avoid direct contact with harsh chemicals, perfumes, and hairsprays.\n• Clean gently with a soft microfibre polishing cloth.",
        options: [
          { label: "Submit Repair Request", value: "Repair" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Jewelry Care Guide": {
        reply: "VRIX Jewelry Care Guide:\n• Store pieces separately in the provided soft linen pouch.\n• Avoid direct contact with harsh chemicals, perfumes, and hairsprays.\n• Clean gently with a soft microfibre polishing cloth.",
        options: [
          { label: "Submit Repair Request", value: "Repair" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      Repair: {
        reply: "To submit a warranty or repair service request, please provide your:\n1. Order Number (e.g. VRIX-1002)\n2. Contact Email Address\n3. Description of the repair needed\n\nOur client concierge will follow up within 24 hours.",
        options: [
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Submit Repair Request": {
        reply: "To submit a warranty or repair service request, please provide your:\n1. Order Number (e.g. VRIX-1002)\n2. Contact Email Address\n3. Description of the repair needed\n\nOur client concierge will follow up within 24 hours.",
        options: [
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "4Cs": {
        reply: "The 4Cs of Diamonds:\n• Cut: Determines brilliance and light refraction.\n• Color: Ranges from D (colorless) to Z.\n• Clarity: Evaluates natural microscopic inclusions (VRIX uses VS+ clarity).\n• Carat: Measures diamond weight.",
        options: [
          { label: "Ethical Sourcing", value: "Sourcing" },
          { label: "Metal Purity Guide", value: "Metals" }
        ]
      },
      Sourcing: {
        reply: "VRIX Solitaire & Metal Sourcing:\nOur lab-grown diamonds are synthesized with zero mining impact, offering 100% conflict-free brilliance chemically identical to mined diamonds. Metals are 100% recycled 925 silver and solid 18K gold vermeil.",
        options: [
          { label: "Metal Purity Guide", value: "Metals" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Metals: {
        reply: "VRIX Metal Purity Guide:\n• 18K Solid Gold & 2.5µm Vermeil: Deep lustre and durable skin comfort.\n• 925 Sterling Silver: Pure hypoallergenic base nickel-free for daily wear.",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      "trigger-handoff": {
        reply: "Our private client concierge associates are available for personal styling, custom bespoke orders, and order assistance.",
        handoff: {
          title: "VRIX Private Concierge",
          description: "Quiet luxury consultation, bespoke guidance, and service.",
          phone: "+91 90542 85693",
          instagram: "https://www.instagram.com/vrix.official",
          linkedin: "https://www.linkedin.com/company/vrixjewels",
          mapsUrl: "https://share.google/EjrRFPTc3O06labrR"
        },
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      "Talk to Concierge": {
        reply: "Our private client concierge associates are available for personal styling, custom bespoke orders, and order assistance.",
        handoff: {
          title: "VRIX Private Concierge",
          description: "Quiet luxury consultation, bespoke guidance, and service.",
          phone: "+91 90542 85693",
          instagram: "https://www.instagram.com/vrix.official",
          linkedin: "https://www.linkedin.com/company/vrixjewels",
          mapsUrl: "https://share.google/EjrRFPTc3O06labrR"
        },
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Minimal: {
        reply: "Explore VRIX minimal everyday silhouettes designed for subtle elegance and daily wear:",
        filterType: "minimal",
        options: [
          { label: "Under ₹15,000", value: "15000" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Solitaire: {
        reply: "Explore VRIX lab-grown solitaire diamonds crafted with VS+ clarity and optical brilliance:",
        filterType: "solitaire",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      15000: {
        reply: "Explore VRIX fine jewelry pieces priced under ₹15,000:",
        filterType: "15000",
        options: [
          { label: "₹15k – ₹50k", value: "50000" },
          { label: "₹50k – ₹2 Lakh", value: "200000" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      50000: {
        reply: "Explore VRIX fine jewelry pieces in the ₹15,000 – ₹50,000 range:",
        filterType: "50000",
        options: [
          { label: "₹50k – ₹2 Lakh", value: "200000" },
          { label: "Atelier Masterpieces (₹2L+)", value: "luxury" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      200000: {
        reply: "Explore VRIX lab-grown solitaire diamonds & fine jewelry in the ₹50,000 – ₹2,00,000 range:",
        filterType: "200000",
        options: [
          { label: "Atelier Masterpieces (₹2L+)", value: "luxury" },
          { label: "Bespoke Configurator", value: "Bespoke" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      luxury: {
        reply: "Explore VRIX High Atelier solitaire masterpieces and bespoke fine jewelry (₹2,00,000+):",
        filterType: "luxury",
        options: [
          { label: "Bespoke Configurator", value: "Bespoke" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      Vermeil: {
        reply: "Explore VRIX 18K Gold Vermeil jewelry featuring thick solid gold over pure 925 sterling silver:",
        filterType: "vermeil",
        options: [
          { label: "Metal Purity Guide", value: "Metals" },
          { label: "Explore collections", value: "collections" }
        ]
      },
      Bespoke: {
        reply: "Bespoke pieces are made-to-order in our Surat atelier. Our goldsmiths work directly with you from preliminary sketch to final setting.",
        bespokeEstimate: {
          pieceType: "Custom Fine Jewelry",
          metalChoice: "18K Solid Gold / 950 Platinum",
          estimatedPriceRange: "₹65,000 – ₹1,80,000",
          leadTime: "3 – 4 Weeks"
        },
        options: [
          { label: "Talk to Concierge", value: "trigger-handoff" },
          { label: "Ring Size Guide", value: "Size Guide" }
        ]
      },
      "Size Guide": {
        reply: "VRIX International Ring Size Guide:\n• Size 5 (US) / 49 (EU): 15.7mm Inner Diameter\n• Size 6 (US) / 52 (EU): 16.5mm Inner Diameter\n• Size 7 (US) / 54 (EU): 17.3mm Inner Diameter\n• Size 8 (US) / 57 (EU): 18.2mm Inner Diameter\n\nWrap a strip of paper around your finger base and measure the millimeter circumference.",
        options: [
          { label: "Bespoke Fitting", value: "Bespoke" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Track Order": {
        reply: "VRIX Order Tracking & Atelier Status:\nTo track your order status:\n1. Provide your Order Reference ID (e.g. VRIX-1002).\n2. Insured express delivery takes 2-4 business days via BlueDart Air.",
        options: [
          { label: "Shipping & Returns", value: "Shipping & Returns" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Visit Atelier": {
        reply: "VRIX Flagship Atelier & Private Studio:\n• Location: Diamond Financial District, Surat, Gujarat 395007\n• Hours: Monday – Saturday, 10:30 AM – 7:30 PM IST\n\nExperience quiet luxury in person with private appointment styling.",
        handoff: {
          title: "VRIX Flagship Atelier — Surat",
          description: "Diamond Financial District, Surat, Gujarat 395007",
          phone: "+91 90542 85693",
          instagram: "https://www.instagram.com/vrix.official",
          linkedin: "https://www.linkedin.com/company/vrixjewels",
          mapsUrl: "https://share.google/EjrRFPTc3O06labrR"
        },
        options: [
          { label: "Bespoke Fitting", value: "Bespoke" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Custom Engraving": {
        reply: "VRIX Bespoke Engraving Service:\n• Character Limit: Up to 25 characters (initials, dates, or personal coordinates).\n• Font Styles: Classic Serif, Minimal Sans-Serif, or Script.\n• Cost: Complimentary on all solid gold & solitaire orders.",
        options: [
          { label: "Bespoke Fitting", value: "Bespoke" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Shipping & Returns": {
        reply: "VRIX Shipping & Return Policy:\n• Delivery: Insured express shipping via BlueDart Air within 2-4 business days.\n• Returns: 30-day complimentary returns on all unworn stock pieces.\n• Packaging: Signature anti-tarnish linen presentation box.",
        options: [
          { label: "Track Order", value: "Track Order" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Redeem Code": {
        reply: adminSaleCode || activeRedeemCodes.length > 0
          ? `Active Atelier Privilege Codes:\n${adminSaleCode ? `• Sale Promo Code: ${adminSaleCode} (${adminHighlight})\n` : ""}${activeRedeemCodes.map(c => `• Code "${c.code}": ${c.description || (c.type === "percentage" ? `${c.discount}% off` : `₹${c.discount} off`)}`).join("\n")}\n\nEnter your code at checkout to apply your privilege.`
          : "There are currently no active public promotional codes. All VRIX pieces are offered with transparent direct atelier pricing.",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Promo Code": {
        reply: adminSaleCode || activeRedeemCodes.length > 0
          ? `Active Atelier Privilege Codes:\n${adminSaleCode ? `• Sale Promo Code: ${adminSaleCode} (${adminHighlight})\n` : ""}${activeRedeemCodes.map(c => `• Code "${c.code}": ${c.description || (c.type === "percentage" ? `${c.discount}% off` : `₹${c.discount} off`)}`).join("\n")}\n\nEnter your code at checkout to apply your privilege.`
          : "There are currently no active public promotional codes. All VRIX pieces are offered with transparent direct atelier pricing.",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      All: {
        reply: "Explore VRIX signature fine jewelry collections across all categories:",
        filterType: "all",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      },
      "Not sure yet": {
        reply: "Explore VRIX signature fine jewelry collections across all categories:",
        filterType: "all",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Talk to Concierge", value: "trigger-handoff" }
        ]
      }
    };

    let matchedKey = targetKey;
    if (targetKey && !QUICK_ACTION_MAP[targetKey]) {
      const lowerKey = String(targetKey).toLowerCase().trim();
      const found = Object.keys(QUICK_ACTION_MAP).find(k => k.toLowerCase().trim() === lowerKey);
      if (found) matchedKey = found;
    }

    if (matchedKey && QUICK_ACTION_MAP[matchedKey]) {
      const actionConfig = QUICK_ACTION_MAP[matchedKey];
      let products = [];
      try {
        const allProds = await db.products.findMany();
        if (Array.isArray(allProds)) {
          let list = allProds.filter(p => p.isVisible !== false);

          if (actionConfig.filterType) {
            const fLower = actionConfig.filterType.toLowerCase();
            if (fLower === "all") {
              // Keep full active catalog list
            } else if (fLower === "15000") {
              list = list.filter(p => Number(p.price) <= 15000);
            } else if (fLower === "minimal") {
              list = list.filter(p => (p.material || p.title || "").toLowerCase().includes("minimal") || (p.description || "").toLowerCase().includes("everyday"));
            } else if (fLower === "solitaire") {
              list = list.filter(p => (p.title || p.description || "").toLowerCase().includes("solitaire") || (p.title || p.description || "").toLowerCase().includes("diamond"));
            } else if (fLower === "vermeil") {
              list = list.filter(p => (p.material || "").toLowerCase().includes("vermeil") || (p.material || "").toLowerCase().includes("gold"));
            } else if (fLower === "partner") {
              list = list.filter(p => {
                const t = (p.type || p.collection || "").toLowerCase();
                return t.includes("necklace") || t.includes("ring");
              });
            } else if (fLower === "parent") {
              list = list.filter(p => {
                const t = (p.type || p.collection || "").toLowerCase();
                return t.includes("bracelet") || t.includes("earring");
              });
            } else if (fLower === "friend") {
              list = list.filter(p => Number(p.price) <= 25000);
            } else {
              const stem = fLower.endsWith("s") ? fLower.slice(0, -1) : fLower;
              list = list.filter(p => {
                const pType = (p.type || "").toLowerCase().trim();
                const pCol = (p.collection || "").toLowerCase().trim();
                const pMat = (p.material || "").toLowerCase().trim();
                const pTitle = (p.title || "").toLowerCase().trim();
                const pTags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase().trim()) : [];

                // Exclude false-positives where "ring" matches "earring"
                if (stem === "ring" || fLower === "rings") {
                  if (pType.includes("earring") || pCol.includes("earring") || pTitle.includes("earring")) {
                    return false;
                  }
                }

                // Exact equality or stem match
                if (pType === fLower || pType === stem || pCol === fLower || pCol === stem) {
                  return true;
                }

                // Tags match
                if (pTags.includes(fLower) || pTags.includes(stem)) {
                  return true;
                }

                // Word boundary matching (e.g. \bring\b matches "ring" but NOT "earring")
                const wordBoundaryRegex = new RegExp(`\\b${stem}\\b`, "i");
                return (
                  wordBoundaryRegex.test(pType) ||
                  wordBoundaryRegex.test(pCol) ||
                  wordBoundaryRegex.test(pTitle) ||
                  wordBoundaryRegex.test(pMat)
                );
              });
            }

            // Fallback: If 0 items matched specific filter, return top active catalog products so customer is never empty-handed
            if (list.length === 0) {
              list = allProds.filter(p => p.isVisible !== false);
            }
          } else {
            // Do not force dummy products for menu options
            list = [];
          }

          products = list.slice(0, 4).map(p => ({
            id: p.id,
            title: p.title,
            category: p.type || p.collection || "Jewelry",
            material: p.material || "18K Gold / 950 Platinum",
            price: Number(p.price) || 0,
            image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
            slug: p.id
          }));
        }
      } catch (e) {}

      let replyText = actionConfig.reply;
      let comparison = undefined;

      if (matchedKey === "compare" || matchedKey === "Compare these pieces") {
        const compList = products.length >= 2 ? products : list.slice(0, 3);
        comparison = {
          title: "Side-by-Side Fine Jewelry Specification Comparison",
          products: compList.map(p => ({
            id: p.id,
            title: p.title,
            image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
            price: Number(p.price) || 0,
            material: p.material || "18K Gold / 950 Platinum",
            stone: p.subtitle || p.category || "Lab Diamond (VS+)",
            category: p.category || p.type || "Fine Jewelry",
            warranty: "VRIX Lifetime Craftsmanship Guarantee",
            slug: p.id
          }))
        };
        replyText = "Here is a side-by-side specification comparison of our signature pieces from the active database catalog:";
      }

      const isoTimestamp = new Date().toISOString();
      return res.json({
        success: true,
        sessionId: session.id,
        reply: replyText,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "bot",
            text: replyText,
            products: products.length > 0 ? products : undefined,
            comparison,
            handoff: actionConfig.handoff,
            bespokeEstimate: actionConfig.bespokeEstimate,
            socialLinks: actionConfig.socialLinks,
            emailCollector: actionConfig.emailCollector,
            saleDiscountCard: actionConfig.saleDiscountCard,
            options: actionConfig.options,
            timestamp: isoTimestamp
          }
        ]
      });
    }

    // Record user message in DB asynchronously without blocking response
    if (db.chatMessage) {
      db.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "user",
          content: userText
        }
      }).catch(() => { });
    }

    // Cache-Aside lookup: if identical query was answered recently in current mode, return in <15ms
    const modeKey = req.body?.launchMode || "DISABLED";
    const cacheKey = `${modeKey}::${userText.toLowerCase()}`;
    const cachedResponse = getCachedResponse(cacheKey);

    if (cachedResponse) {
      return res.json({
        ...cachedResponse,
        sessionId: session.id,
        fromCache: true
      });
    }

    const qLower = userText.toLowerCase().trim();
    const isLaunchMode = (req.body?.launchMode === "LAUNCH") || (cmsCountdown?.isLaunchActive === true);
    const isSaleMode = (req.body?.launchMode === "SALE") || (cmsCountdown?.isSaleActive === true);

    // ── Instant Fast-Path Intent Resolver (<5ms latency) ─────────────────────
    let fastReply = null;
    let fastOptions = [
      { label: "Find a piece for myself", value: "myself" },
      { label: "Find a gift", value: "gift" },
      { label: "Explore collections", value: "collections" }
    ];
    let fastSocial = undefined;
    let fastEmail = undefined;
    let fastSaleCard = undefined;

    // 1. Instant Greetings
    if (/^(hi|hello|hey|namaste|kem cho|good morning|good evening|good afternoon|hlw|hoi|yo|sup)\b/i.test(qLower) || qLower === "hi" || qLower === "hello") {
      if (isLaunchMode) {
        fastReply = "Welcome to VRIX. Our digital atelier arrives soon. Enter your email below to join our private VIP waitlist for early access, or follow our journey on Instagram and Facebook:";
        fastEmail = { placeholder: "your.email@example.com", buttonText: "Notify Me" };
        fastSocial = {
          title: "Follow VRIX Atelier",
          description: "Official releases, previews, and live countdown stories.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280"
        };
        fastOptions = [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "About VRIX Lab Diamonds", value: "education" }
        ];
      } else if (isSaleMode) {
        const codeNote = adminSaleCode ? ` with code [${adminSaleCode}]` : ` (direct atelier pricing)`;
        fastReply = `Welcome to VRIX. The Private Archive Event is currently active across our atelier. Enjoy ${adminHighlight}${codeNote}. How may I assist your exploration today?`;
        fastSaleCard = {
          highlight: adminHighlight,
          code: adminSaleCode || undefined,
          ctaUrl: "/collections"
        };
      } else {
        fastReply = `Welcome to VRIX. "A luxury that feels like you." How may our atelier concierge assist your exploration today?`;
        fastOptions = [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Diamond Education", value: "education" },
          { label: "Compare products", value: "compare" }
        ];
      }
    }
    // 2. Instant Launch Inquiries
    else if (isLaunchMode && (qLower.includes("when") || qLower.includes("date") || qLower.includes("launch") || qLower.includes("open") || qLower.includes("timing") || qLower.includes("start"))) {
      const targetDateFormatted = cmsCountdown?.targetDate
        ? new Date(cmsCountdown.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "Coming Soon";
      fastReply = `Our digital atelier arrives on ${targetDateFormatted}. We craft architectural lab-grown diamonds with quiet luxury. Join our private VIP waitlist for early access:`;
      fastEmail = { placeholder: "your.email@example.com", buttonText: "Notify Me" };
      fastSocial = {
        title: "Follow VRIX Atelier",
        description: "Official releases, previews, and live countdown stories.",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280"
      };
      fastOptions = [
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "About VRIX Lab Diamonds", value: "education" }
      ];
    }
    // 3. Instant Promo Code & Coupon Inquiries
    else if (qLower.includes("promo") || qLower.includes("coupon") || qLower.includes("code") || qLower.includes("discount code") || qLower.includes("voucher") || qLower.includes("offer")) {
      if (adminSaleCode) {
        fastReply = `Our active archive promotion is ${adminHighlight}. Apply official code ${adminSaleCode} at checkout to receive your privilege.`;
        fastSaleCard = {
          highlight: adminHighlight,
          code: adminSaleCode,
          ctaUrl: "/collections"
        };
      } else if (activeRedeemCodes.length > 0) {
        fastReply = `Our active atelier privilege code is ${activeRedeemCodes[0].code} (${activeRedeemCodes[0].description || "special discount"}). Enter it at checkout to apply your privilege.`;
      } else {
        fastReply = "There are currently no active public promotional codes. All VRIX pieces are offered with transparent direct atelier pricing.";
      }
    }
    // 4. Instant Return & Shipping Policies
    else if (qLower.includes("return") || qLower.includes("exchange") || qLower.includes("refund")) {
      fastReply = "VRIX offers a 15-day complimentary return window on unworn pieces in original packaging, along with lifetime craftsmanship exchange on our lab-grown diamond solitaires.";
      fastOptions = [
        { label: "Shipping Schedule", value: "Shipping Schedule" },
        { label: "Talk to concierge", value: "trigger-handoff" }
      ];
    }
    else if (qLower.includes("shipping") || qLower.includes("delivery") || qLower.includes("delivering") || qLower.includes("track")) {
      fastReply = "We provide complimentary insured express delivery across India in 2–4 business days via BlueDart Air, with discrete signature confirmation upon delivery.";
      fastOptions = [
        { label: "Return Policy", value: "Return Policy" },
        { label: "Talk to concierge", value: "trigger-handoff" }
      ];
    }
    else if (qLower.includes("diamond") && (qLower.includes("real") || qLower.includes("lab") || qLower.includes("fake") || qLower.includes("natural"))) {
      fastReply = "VRIX lab-grown diamonds are 100% genuine crystallized carbon diamonds with identical optical, chemical, and physical properties to mined stones. Every solitaire arrives with independent gemological certification (IGI/SGL) and VS+ clarity.";
      fastOptions = [
        { label: "The 4Cs of Diamonds", value: "4Cs" },
        { label: "Explore collections", value: "collections" }
      ];
    }
    else if (qLower.includes("address") || qLower.includes("location") || qLower.includes("surat") || qLower.includes("visit") || qLower.includes("studio") || qLower.includes("contact") || qLower.includes("whatsapp")) {
      fastReply = "VRIX Flagship Atelier & Studio:\n• Location: Diamond Financial District, Surat, Gujarat 395007\n• Hours: Monday – Saturday, 10:30 AM – 7:30 PM IST\n• Contact: +91 90542 85693";
      fastOptions = [
        { label: "Talk to concierge", value: "trigger-handoff" },
        { label: "Explore collections", value: "collections" }
      ];
    }

    if (fastReply) {
      const fastResult = {
        success: true,
        sessionId: session.id,
        reply: fastReply,
        structuredData: {
          options: fastOptions,
          socialLinks: fastSocial,
          emailCollector: fastEmail,
          saleDiscountCard: fastSaleCard
        },
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "bot",
            text: fastReply,
            options: fastOptions,
            socialLinks: fastSocial,
            emailCollector: fastEmail,
            saleDiscountCard: fastSaleCard,
            timestamp: new Date().toISOString()
          }
        ]
      };
      setCachedResponse(cacheKey, fastResult);
      return res.json(fastResult);
    }

    // Execute Gemini Interactions loop with high-speed 3500ms timeout ceiling
    const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 3500;
    let timeoutTimer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error("Gemini API timeout")), timeoutMs);
    });

    const chatPromise = runInteractionsChatLoop({
      userMessage: userText,
      previousInteractionId: session.lastInteractionId,
      sessionId: session.id,
      launchContext: {
        launchMode: req.body?.launchMode || (cmsCountdown?.isLaunchActive ? "LAUNCH" : (cmsCountdown?.isSaleActive ? "SALE" : "DISABLED")),
        targetDate: req.body?.targetDate || cmsCountdown?.targetDate,
        saleDiscountHighlight: adminHighlight,
        saleDiscountCode: adminSaleCode,
        saleTitle: req.body?.saleTitle || cmsCountdown?.saleTitle,
        adminPromoCodes: [
          ...(adminSaleCode ? [{ code: adminSaleCode, description: `${adminHighlight} (Archive Sale)` }] : []),
          ...activeRedeemCodes.map(c => ({
            code: c.code,
            description: c.description || (c.type === "percentage" ? `${c.discount}% off` : `₹${c.discount} off`)
          }))
        ]
      }
    });

    let result;
    try {
      result = await Promise.race([chatPromise, timeoutPromise]);
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    }

    // Update session last_interaction_id
    if (result.lastInteractionId && db.chatSession) {
      try {
        await db.chatSession.update({
          where: { id: session.id },
          data: { lastInteractionId: result.lastInteractionId }
        });
      } catch (e) { }
    }

    // Record assistant message in DB
    if (db.chatMessage) {
      try {
        await db.chatMessage.create({
          data: {
            sessionId: session.id,
            role: "assistant",
            content: result.reply,
            toolCalls: result.toolsUsed
          }
        });
      } catch (e) { }
    }

    const isoTimestamp = new Date().toISOString();

    // Default quick reply options if none provided by tool
    const options = result.structuredData?.options || [
      { label: "Find a piece for myself", value: "myself" },
      { label: "Find a gift", value: "gift" },
      { label: "Explore collections", value: "collections" },
      { label: "Talk to concierge", value: "trigger-handoff" }
    ];

    const responsePayload = {
      success: true,
      sessionId: session.id,
      reply: result.reply,
      toolsUsed: result.toolsUsed,
      structuredData: {
        ...result.structuredData,
        options
      },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: result.reply,
          products: result.structuredData?.products,
          comparison: result.structuredData?.comparison,
          bespokeEstimate: result.structuredData?.bespokeEstimate,
          handoff: result.structuredData?.handoff,
          socialLinks: result.structuredData?.socialLinks,
          emailCollector: result.structuredData?.emailCollector,
          saleDiscountCard: result.structuredData?.saleDiscountCard,
          options,
          timestamp: isoTimestamp
        }
      ]
    };

    // Cache successful response for fast subsequent retrieval
    setCachedResponse(cacheKey, responsePayload);

    return res.json(responsePayload);
  } catch (err) {
    console.warn("Chat message endpoint fallback triggered:", err?.message || err);

    let fallbackProducts = [];
    let fallbackReply = "Our client associates are currently experiencing high volume. Here are signature pieces from our atelier, or connect directly with our private concierge:";

    try {
      // Intelligent catalog matching so customer is never left empty-handed on timeout or network lag
      const queryLower = (userText || "").toLowerCase();
      const allProds = await db.products.findMany().catch(() => []);
      const visible = (allProds || []).filter(p => p.isVisible !== false);

      const keywords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const matched = visible.filter(p => {
        const title = (p.title || "").toLowerCase();
        const type = (p.type || p.collection || "").toLowerCase();
        const mat = (p.material || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return keywords.some(k => title.includes(k) || type.includes(k) || mat.includes(k) || desc.includes(k));
      });

      const chosen = matched.length > 0 ? matched : visible;
      fallbackProducts = chosen.slice(0, 4).map(p => ({
        id: p.id,
        title: p.title,
        category: p.type || p.collection || "Jewelry",
        material: p.material || "18K Gold / 950 Platinum",
        price: Number(p.price) || 0,
        image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
        slug: p.id
      }));

      if (matched.length > 0) {
        fallbackReply = "Here are signature pieces from our atelier tailored to your inquiry:";
      }
    } catch (fallbackErr) {
      // keep fallback defaults
    }

    const isoTimestamp = new Date().toISOString();
    const isLaunchMode = req.body?.launchMode === "LAUNCH";
    const isSaleMode = req.body?.launchMode === "SALE";

    let fallbackOptions = [
      { label: "Find a piece for myself", value: "myself" },
      { label: "Find a gift", value: "gift" },
      { label: "Talk to concierge", value: "trigger-handoff" }
    ];

    let fallbackSocialLinks = undefined;
    let fallbackEmailCollector = undefined;
    let fallbackSaleDiscount = undefined;

    if (isLaunchMode) {
      fallbackReply = "Welcome to VRIX. Our digital atelier arrives soon. Enter your email below to join our private VIP waitlist for early access, or follow our journey on Instagram and Facebook:";
      fallbackEmailCollector = {
        placeholder: "your.email@example.com",
        buttonText: "Notify Me"
      };
      fallbackSocialLinks = {
        title: "Follow VRIX Atelier",
        description: "Official releases, previews, and live countdown stories.",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280"
      };
      fallbackOptions = [
        { label: "When is the Launch?", value: "launch_date" },
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "Instagram & Facebook", value: "social_channels" },
        { label: "About VRIX Lab Diamonds", value: "education" }
      ];
    } else if (isSaleMode) {
      const codePart = adminSaleCode ? ` with code ${adminSaleCode}` : ` (direct pricing applied at checkout)`;
      fallbackReply = `Welcome to VRIX. The Private Archive Event is active. Enjoy ${adminHighlight} on signature lab diamond solitaires${codePart}.`;
      fallbackSaleDiscount = {
        highlight: adminHighlight,
        code: adminSaleCode || undefined,
        ctaUrl: "/collections"
      };
      fallbackOptions = [
        { label: "Find a piece for myself", value: "myself" },
        { label: "Find a gift", value: "gift" },
        { label: "Explore collections", value: "collections" }
      ];
    }

    res.json({
      success: true,
      sessionId: sessionId || `sess-${Date.now()}`,
      reply: fallbackReply,
      toolsUsed: [],
      structuredData: {
        products: fallbackProducts.length > 0 ? fallbackProducts : undefined,
        options: fallbackOptions,
        socialLinks: fallbackSocialLinks,
        emailCollector: fallbackEmailCollector,
        saleDiscountCard: fallbackSaleDiscount
      },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: fallbackReply,
          products: fallbackProducts.length > 0 ? fallbackProducts : undefined,
          socialLinks: fallbackSocialLinks,
          emailCollector: fallbackEmailCollector,
          saleDiscountCard: fallbackSaleDiscount,
          options: fallbackOptions,
          timestamp: isoTimestamp
        }
      ]
    });
  }
};

router.post("/ask", chatbotLimiter, handleChatMessage);
router.post("/message", chatbotLimiter, handleChatMessage);
router.post("/", chatbotLimiter, handleChatMessage);
router.post("/query", chatbotLimiter, handleChatMessage);

export default router;
