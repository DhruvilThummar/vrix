import express from "express";
import { db } from "../database.js";
import { runInteractionsChatLoop } from "../services/geminiService.js";

const router = express.Router();

// Simple in-memory sliding window rate limiter (max 30 requests per minute per IP)
const rateLimitMap = new Map();

function applyRateLimit(ipOrSession) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  const record = rateLimitMap.get(ipOrSession) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }

  rateLimitMap.set(ipOrSession, record);

  if (record.count > maxRequests) {
    return false;
  }
  return true;
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

// ── POST /api/chat/message — Gemini Interactions API Endpoint ────────────────
router.post("/message", async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
  let { sessionId, userId } = req.body || {};

  // Normalize user message from any request payload shape
  const userText = normalizeUserMessage(req.body);

  if (!userText) {
    return res.status(400).json({
      error: "Message content cannot be empty."
    });
  }

  // Rate Limiter Check
  if (!applyRateLimit(sessionId || clientIp)) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait a moment before sending another message."
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
          { label: "Explore all collections", value: "collections" },
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
          { label: "Explore collections", value: "collections" }
        ]
      }
    };

    if (targetKey && QUICK_ACTION_MAP[targetKey]) {
      const actionConfig = QUICK_ACTION_MAP[targetKey];
      let products = [];
      try {
        const allProds = await db.products.findMany();
        if (Array.isArray(allProds)) {
          let list = allProds.filter(p => p.isVisible !== false);

          if (actionConfig.filterType) {
            const fLower = actionConfig.filterType.toLowerCase();
            if (fLower === "15000") {
              list = list.filter(p => Number(p.price) <= 15000);
            } else if (fLower === "minimal") {
              list = list.filter(p => (p.material || p.title || "").toLowerCase().includes("minimal") || (p.description || "").toLowerCase().includes("everyday"));
            } else if (fLower === "solitaire") {
              list = list.filter(p => (p.title || p.description || "").toLowerCase().includes("solitaire") || (p.title || p.description || "").toLowerCase().includes("diamond"));
            } else if (fLower === "vermeil") {
              list = list.filter(p => (p.material || "").toLowerCase().includes("vermeil") || (p.material || "").toLowerCase().includes("gold"));
            } else if (fLower === "partner") {
              list = list.filter(p => (p.type || p.collection || "").toLowerCase() === "necklaces" || (p.type || p.collection || "").toLowerCase() === "rings");
            } else if (fLower === "parent") {
              list = list.filter(p => (p.type || p.collection || "").toLowerCase() === "bracelets" || (p.type || p.collection || "").toLowerCase() === "earrings");
            } else if (fLower === "friend") {
              list = list.filter(p => Number(p.price) <= 25000);
            } else {
              list = list.filter(p => (p.type || p.collection || "").toLowerCase() === fLower);
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

      const isoTimestamp = new Date().toISOString();
      return res.json({
        success: true,
        sessionId: session.id,
        reply: actionConfig.reply,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "bot",
            text: actionConfig.reply,
            products: products.length > 0 ? products : undefined,
            handoff: actionConfig.handoff,
            bespokeEstimate: actionConfig.bespokeEstimate,
            options: actionConfig.options,
            timestamp: isoTimestamp
          }
        ]
      });
    }

    // Record user message in DB
    await db.chatMessage?.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: userText
      }
    }).catch(() => { });

    // Execute Gemini Interactions loop with 15-second timeout safeguard
    const timeoutMs = 15000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout")), timeoutMs)
    );

    const chatPromise = runInteractionsChatLoop({
      userMessage: userText,
      previousInteractionId: session.lastInteractionId,
      sessionId: session.id
    });

    const result = await Promise.race([chatPromise, timeoutPromise]);

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

    // Return unified contract matching widget expectations
    res.json({
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
          options,
          timestamp: isoTimestamp
        }
      ]
    });
  } catch (err) {
    console.error("Chat message endpoint error:", err);

    // Quiet luxury graceful error fallback
    const fallbackText = "Our client associates are currently experiencing high volume. Please try again in a few moments, or connect directly with our concierge team.";

    res.json({
      success: true,
      sessionId: sessionId || `sess-${Date.now()}`,
      reply: fallbackText,
      toolsUsed: [],
      structuredData: {
        options: [
          { label: "Try again", value: "retry" },
          { label: "Talk to concierge", value: "trigger-handoff" }
        ]
      },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: fallbackText,
          options: [
            { label: "Try again", value: "retry" },
            { label: "Talk to concierge", value: "trigger-handoff" }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    });
  }
});

// Also support legacy /query path for backward compatibility
router.post("/query", (req, res, next) => {
  req.url = "/message";
  return router._handle(req, res, next);
});

export default router;
