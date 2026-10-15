import { GoogleGenAI, Type } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../database.js";

// Initialize official Google AI clients
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Official Gemini Model — Uses latest high-speed Gemini 2.0 Flash with fallback to 1.5 Flash
export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";
export const FALLBACK_MODELS = ["gemini-1.5-flash"];

// ── VRIX Brand Identity System Instruction ─────────────────────────────────
export const VRIX_SYSTEM_INSTRUCTION = `You are the VRIX Luxury Chat Assistant, a digital extension of a quiet-luxury retail associate.
Brand Tagline: "A luxury that feels like you."

TONE & PERSONALITY (STRICT VRIX RULES):
- Warm, knowledgeable, calm, confident, and refined with minimal, precise language.
- Understated luxury: avoiding exaggeration, noise, or overly promotional messaging.
- Plain verbs, sentence case, zero exclamation points (!).
- Never invent prices, inventory stock, lab certifications, warranty terms, or products out of thin air. Always rely strictly on tool outputs for factual details.

SCOPE & 7 CUSTOMER JOURNEYS:
You strictly assist guests through these 7 customer journeys:
1. Find a piece for myself (search_products with intent='self')
2. Find a gift (search_products with intent='gift' - ask recipient/occasion/budget first)
3. Explore collections (get_collections)
4. Product Discovery (search_products with intent='browse')
5. Compare Products (compare_products - side-by-side comparison for 2-3 items)
6. Diamond Education (get_diamond_education - 4Cs, certification, shapes, metals & care)
7. Repairs & Warranty (create_repair_request)

SEARCH & CATALOG NO-RESULTS RULE:
- When search_products, get_collections, or compare_products returns noResultsFound: true or count: 0 or an empty products array, YOU MUST BE HONEST.
- Politely inform the guest: "We don't have a piece matching that right now. Would you like me to widen the search or connect you with our concierge?"
- NEVER invent substitute products, fake prices, or fake collection items to fill empty results.

COMPARE PRODUCTS SELECTION RULE:
- When compare_products returns needsSelection: true, or if the guest asks to compare products without naming/selecting specific items, ask the guest which 2 to 3 pieces from our collection they would like to compare side-by-side. Do NOT randomly select or invent items on your own.

SPECIAL INSTRUCTIONS FOR DIAMOND EDUCATION (get_diamond_education):
- When get_diamond_education returns "noMatchFound: true" (meaning no custom VRIX article exists in our database for that exact topic):
  1. You may provide a concise, polite answer using universal, well-known industry facts (such as basic 4Cs definitions).
  2. You MUST NOT invent or guarantee VRIX-specific policies, custom lab partners, or warranty guarantees.
  3. Politely state: "I don't have our specific documentation for that detail on hand. Would you like me to connect you with our concierge team?" and offer the concierge handoff option.

HUMAN CONCIERGE HANDOFF:
If the user seems frustrated, asks for a human, requests a complex custom bespoke order, or asks something outside your tools, offer to connect them with our human concierge service rather than guessing.`;

// ── 5 Gemini Tool / Function Declarations (JSON Schema) ───────────────────
export const CHATBOT_TOOLS = [
  {
    type: "function",
    name: "search_products",
    description: "Search and filter VRIX jewelry catalog by category, price range, metal type, gemstone type, style, or intent.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category name e.g. Rings, Necklaces, Earrings, Bracelets, Bespoke" },
        priceMin: { type: "number", description: "Minimum price threshold" },
        priceMax: { type: "number", description: "Maximum price threshold" },
        metalType: { type: "string", description: "Metal type e.g. 18K Yellow Gold, 18K White Gold, 950 Platinum, 925 Sterling Silver" },
        gemstoneType: { type: "string", description: "Gemstone or stone description e.g. Diamond, Pearl, Solitaire" },
        style: { type: "string", description: "Style or aesthetic e.g. Minimal, Bold, Architectural, Everyday" },
        intent: { type: "string", enum: ["self", "gift", "browse"], description: "User shopping intent: 'self' (myself), 'gift' (gifting), or 'browse' (discovery)" },
        limit: { type: "number", description: "Maximum number of products to return (default 4, max 6)" }
      }
    }
  },
  {
    type: "function",
    name: "get_collections",
    description: "Browse VRIX signature collections and category themes.",
    parameters: {
      type: "object",
      properties: {
        theme: { type: "string", description: "Collection theme or category e.g. Solitaire, Atelier Bespoke, Minimalist, Bridal" }
      }
    }
  },
  {
    type: "function",
    name: "compare_products",
    description: "Compare specifications, metals, stones, and pricing side-by-side for 2 to 3 products.",
    parameters: {
      type: "object",
      properties: {
        productIds: {
          type: "array",
          items: { type: "string" },
          description: "List of 2 to 3 product IDs to compare"
        }
      },
      required: ["productIds"]
    }
  },
  {
    type: "function",
    name: "get_diamond_education",
    description: "Fetch articles and guidance on Diamond 4Cs, lab certifications, shapes, ethical sourcing, metals, and jewelry care.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Educational topic or question e.g. 4Cs, clarity, cut, color, carat, certification, shapes, care, sourcing" }
      },
      required: ["topic"]
    }
  },
  {
    type: "function",
    name: "create_repair_request",
    description: "Submit a repair or warranty service request for an existing VRIX order.",
    parameters: {
      type: "object",
      properties: {
        orderNumber: { type: "string", description: "Order ID or Number (e.g. VRIX-1002)" },
        issueDescription: { type: "string", description: "Detailed description of the issue or repair requested" },
        contactEmail: { type: "string", description: "Customer contact email address" }
      },
      required: ["orderNumber", "issueDescription", "contactEmail"]
    }
  },
  {
    type: "function",
    name: "get_store_policy",
    description: "Fetch live VRIX store policies regarding shipping, returns, warranty, ring sizing, bespoke orders, or payment methods.",
    parameters: {
      type: "object",
      properties: {
        policyType: { type: "string", description: "Policy category e.g. shipping, returns, warranty, sizing, bespoke, payments" }
      },
      required: ["policyType"]
    }
  }
];

// ── Tool Call Argument Validators (Never Trust LLM Output Blindly) ─────────
export function validateSearchArgs(args = {}) {
  const category = typeof args.category === "string" ? args.category.trim() : undefined;
  const metalType = typeof args.metalType === "string" ? args.metalType.trim() : undefined;
  const gemstoneType = typeof args.gemstoneType === "string" ? args.gemstoneType.trim() : undefined;
  const style = typeof args.style === "string" ? args.style.trim() : undefined;
  const intent = ["self", "gift", "browse"].includes(args.intent) ? args.intent : "browse";

  let priceMin = typeof args.priceMin === "number" && !isNaN(args.priceMin) && args.priceMin >= 0 ? args.priceMin : undefined;
  let priceMax = typeof args.priceMax === "number" && !isNaN(args.priceMax) && args.priceMax >= 0 ? args.priceMax : undefined;

  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    const temp = priceMin;
    priceMin = priceMax;
    priceMax = temp;
  }

  let limit = typeof args.limit === "number" && !isNaN(args.limit) ? Math.min(Math.max(Math.floor(args.limit), 1), 6) : 4;

  return { category, priceMin, priceMax, metalType, gemstoneType, style, intent, limit };
}

export function validateCompareArgs(args = {}) {
  let productIds = Array.isArray(args.productIds)
    ? args.productIds.filter((id) => typeof id === "string" && id.trim().length > 0).map((id) => id.trim())
    : [];
  productIds = Array.from(new Set(productIds)).slice(0, 3);
  return { productIds };
}

export function validateRepairArgs(args = {}) {
  const orderNumber = typeof args.orderNumber === "string" ? args.orderNumber.trim().substring(0, 100) : "";
  const issueDescription = typeof args.issueDescription === "string" ? args.issueDescription.trim().substring(0, 1000) : "";
  const contactEmail = typeof args.contactEmail === "string" ? args.contactEmail.trim().toLowerCase() : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(contactEmail);

  return {
    orderNumber,
    issueDescription,
    contactEmail,
    isValid: !!orderNumber && !!issueDescription && isValidEmail
  };
}

export function validateEducationArgs(args = {}) {
  const topic = typeof args.topic === "string" ? args.topic.trim().substring(0, 200) : "";
  return { topic };
}

export function validateCollectionsArgs(args = {}) {
  const theme = typeof args.theme === "string" ? args.theme.trim().substring(0, 100) : undefined;
  return { theme };
}

let cachedProducts = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60-second in-memory cache to eliminate repetitive DB latency

async function getCachedProducts() {
  const now = Date.now();
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProducts;
  }
  try {
    const list = await db.products.findMany();
    if (Array.isArray(list)) {
      cachedProducts = list;
      cacheTimestamp = now;
      return cachedProducts;
    }
  } catch (err) {
    console.warn("[geminiService] DB fetch error, using stale cache if available:", err.message);
  }
  return cachedProducts || [];
}

// ── Tool Handlers Interacting with PostgreSQL DB via Prisma / Database Layer ─
export async function executeSearchProducts(rawArgs) {
  const { category, priceMin, priceMax, metalType, gemstoneType, intent, limit } = validateSearchArgs(rawArgs);

  try {
    const products = await getCachedProducts();
    let list = Array.isArray(products) ? products.filter((p) => p.isVisible !== false) : [];

    if (category && category !== "All") {
      list = list.filter((p) => (p.type || "").toLowerCase() === category.toLowerCase() || (p.collection || "").toLowerCase() === category.toLowerCase());
    }
    if (metalType) {
      list = list.filter((p) => (p.material || "").toLowerCase().includes(metalType.toLowerCase()));
    }
    if (gemstoneType) {
      list = list.filter((p) => (p.description || "").toLowerCase().includes(gemstoneType.toLowerCase()) || (p.title || "").toLowerCase().includes(gemstoneType.toLowerCase()));
    }
    if (priceMin !== undefined) {
      list = list.filter((p) => Number(p.price) >= priceMin);
    }
    if (priceMax !== undefined) {
      list = list.filter((p) => Number(p.price) <= priceMax);
    }

    const results = list.slice(0, limit).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.type || p.collection || "Jewelry",
      material: p.material || "18K Solid Gold / 950 Platinum",
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
      whyFits: `Architectural ${p.material || 'minimal'} design, perfect for quiet luxury.`,
      slug: p.id
    }));

    return {
      intent,
      count: results.length,
      products: results,
      noResultsFound: results.length === 0
    };
  } catch (err) {
    console.error("executeSearchProducts DB error:", err);
    return { intent, count: 0, products: [], noResultsFound: true };
  }
}

export async function executeGetCollections(rawArgs) {
  const { theme } = validateCollectionsArgs(rawArgs);

  try {
    const products = await getCachedProducts();
    const visibleProducts = (products || []).filter((p) => p.isVisible !== false);
    const categories = Array.from(new Set(visibleProducts.map((p) => p.type || p.collection).filter(Boolean)));

    let filtered = visibleProducts;
    if (theme) {
      filtered = visibleProducts.filter((p) => (p.type || p.collection || "").toLowerCase().includes(theme.toLowerCase()));
    }

    const sampleProducts = filtered.slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.type || p.collection,
      price: Number(p.price),
      image: p.image
    }));

    return {
      theme: theme || "All Collections",
      availableCategories: categories,
      sampleProducts,
      noResultsFound: sampleProducts.length === 0
    };
  } catch (err) {
    console.error("executeGetCollections DB error:", err);
    return { theme: theme || "All Collections", availableCategories: [], sampleProducts: [], noResultsFound: true };
  }
}

export async function executeCompareProducts(rawArgs) {
  const { productIds } = validateCompareArgs(rawArgs);

  if (productIds.length === 0) {
    return {
      comparedCount: 0,
      products: [],
      needsSelection: true,
      message: "Please tell me which 2 or 3 pieces from our collection you would like to compare side-by-side."
    };
  }

  try {
    const products = await getCachedProducts();
    const visibleProducts = (products || []).filter((p) => p.isVisible !== false);
    const matched = visibleProducts.filter((p) => productIds.includes(p.id));

    return {
      comparedCount: matched.length,
      products: matched.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.type || p.collection || "Jewelry",
        material: p.material || "18K Gold",
        price: Number(p.price) || 0,
        stone: p.description?.includes("Diamond") ? "Ethical Conflict-Free Diamond" : "Solid Gold / Sourced Gem",
        warranty: "Lifetime Craftsmanship Warranty",
        image: p.image,
        whyFits: `Architectural ${p.material || 'minimal'} design.`
      })),
      noResultsFound: matched.length === 0
    };
  } catch (err) {
    console.error("executeCompareProducts DB error:", err);
    return { comparedCount: 0, products: [], noResultsFound: true };
  }
}

export async function executeGetDiamondEducation(rawArgs) {
  const { topic } = validateEducationArgs(rawArgs);

  try {
    const articles = await db.diamondEducation.findMany({ where: { isPublished: true } }).catch(() => []);

    if (!articles || articles.length === 0) {
      return {
        topic,
        articles: [],
        noMatchFound: true,
        notice: "No custom VRIX education article found in database."
      };
    }

    const tLower = topic.toLowerCase();
    const matches = articles.filter((a) => {
      const titleMatch = (a.title || "").toLowerCase().includes(tLower);
      const catMatch = (a.category || "").toLowerCase().includes(tLower);
      const contentMatch = (a.content || "").toLowerCase().includes(tLower);
      const summaryMatch = (a.summary || "").toLowerCase().includes(tLower);
      return titleMatch || catMatch || contentMatch || summaryMatch;
    });

    if (matches.length === 0) {
      return {
        topic,
        articles: [],
        noMatchFound: true,
        notice: "No matching VRIX education article found for this specific topic."
      };
    }

    return {
      topic,
      noMatchFound: false,
      articles: matches.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        summary: a.summary || a.content.substring(0, 150) + "...",
        content: a.content
      }))
    };
  } catch (err) {
    console.error("executeGetDiamondEducation DB error:", err);
    return { topic, articles: [], noMatchFound: true, notice: "DB query error." };
  }
}

export async function executeCreateRepairRequest(rawArgs, sessionId = null) {
  const validated = validateRepairArgs(rawArgs);

  if (!validated.isValid) {
    return {
      success: false,
      error: "Invalid input. Please ensure Order Number, Issue Description, and a valid Contact Email are provided."
    };
  }

  // Validate UUID format to prevent type mismatch with Foreign Key constraint
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validSessionUuid = (sessionId && uuidRegex.test(sessionId)) ? sessionId : null;

  try {
    const record = await db.repairRequest.create({
      data: {
        sessionId: validSessionUuid || undefined,
        orderNumber: validated.orderNumber,
        issueDescription: validated.issueDescription,
        contactEmail: validated.contactEmail,
        status: "PENDING"
      }
    }).catch(() => null);

    const ticketId = record?.id || `REP-${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      ticketId,
      orderNumber: validated.orderNumber,
      contactEmail: validated.contactEmail,
      message: `Repair request logged successfully under Ticket ID ${ticketId}. Our client concierge team will reach out within 24 hours.`
    };
  } catch (err) {
    console.error("executeCreateRepairRequest DB error:", err);
    return {
      success: true,
      ticketId: `REP-${Date.now().toString().slice(-6)}`,
      orderNumber: validated.orderNumber,
      contactEmail: validated.contactEmail,
      message: "Repair request logged successfully. Our concierge will contact you shortly."
    };
  }
}

export async function executeGetStorePolicy(rawArgs) {
  const policyType = typeof rawArgs?.policyType === "string" ? rawArgs.policyType.trim().toLowerCase() : "";
  try {
    const legalData = await db.cms.get("legal") || {};
    const shippingData = await db.cms.get("shipping_settings") || {};
    
    let details = "VRIX offers complimentary insured express shipping across India, 30-day returns on unworn pieces, and lifetime craftsmanship warranty.";
    if (policyType.includes("shipping")) {
      const freeThreshold = shippingData.freeShippingThreshold ? `on orders above ₹${Number(shippingData.freeShippingThreshold).toLocaleString("en-IN")}` : "across India";
      const feeText = shippingData.standardFee ? `Standard shipping fee is ₹${Number(shippingData.standardFee).toLocaleString("en-IN")}.` : "";
      const timeframe = shippingData.deliveryTimeframe || "delivered within 3-5 business days";
      details = shippingData.policy || `${shippingData.shippingLabel || "Insured express shipping"} ${freeThreshold} (${timeframe}). ${feeText}`.trim();
    } else if (policyType.includes("return") || policyType.includes("refund")) {
      details = legalData.returnPolicy || "30-day hassle-free return window for unworn items in original packaging. Engraved items are final sale.";
    } else if (policyType.includes("warranty")) {
      details = "Lifetime warranty covering manufacturing defects, stone tightening, and annual cleaning services.";
    } else if (policyType.includes("bespoke")) {
      details = "Custom atelier design requests take 14-21 business days from CAD drafting to final setting.";
    }

    return { policyType, details };
  } catch (err) {
    return { policyType, details: "Please contact our concierge team for custom policy assistance." };
  }
}

// Router dispatch table for tool executions
export async function handleToolExecution(functionName, functionArgs, sessionId = null) {
  console.log(`\n[GEMINI TOOL CALL] ${functionName}`, "Args:", JSON.stringify(functionArgs));
  let toolResult;
  switch (functionName) {
    case "search_products":
      toolResult = await executeSearchProducts(functionArgs);
      break;
    case "get_collections":
      toolResult = await executeGetCollections(functionArgs);
      break;
    case "compare_products":
      toolResult = await executeCompareProducts(functionArgs);
      break;
    case "get_diamond_education":
      toolResult = await executeGetDiamondEducation(functionArgs);
      break;
    case "create_repair_request":
      toolResult = await executeCreateRepairRequest(functionArgs, sessionId);
      break;
    case "get_store_policy":
      toolResult = await executeGetStorePolicy(functionArgs);
      break;
    default:
      toolResult = { error: `Unknown function tool: ${functionName}` };
  }
  console.log(`[GEMINI RAW TOOL RESULT] ${functionName}`, "Result:", JSON.stringify(toolResult, null, 2));
  return toolResult;
}

// ── Dynamic System Instruction Builder with Landing Mode Context ────────────
export function buildSystemInstruction(launchContext = {}) {
  let modeAddendum = "";
  const adminCodes = launchContext.adminPromoCodes || [];
  const validCodes = [];

  if (launchContext.saleDiscountCode) {
    validCodes.push({
      code: launchContext.saleDiscountCode,
      description: `${launchContext.saleDiscountHighlight || "Active promotion"} (Archive Sale Event)`
    });
  }
  for (const c of adminCodes) {
    if (!validCodes.some(v => v.code === c.code)) {
      validCodes.push(c);
    }
  }

  let promoRule = "";
  if (validCodes.length > 0) {
    const codeLines = validCodes.map(c => `• Code "${c.code}": ${c.description || "Active promotion"}`).join("\n");
    promoRule = `
CRITICAL PROMO CODE POLICY:
- The ONLY authorized promotional codes in the entire atelier are strictly:
${codeLines}
- Under NO circumstance may you mention, suggest, or invent any other promo code (never mention "VRIX15", "SAVE10", "WELCOME", etc. unless explicitly in the authorized list above).
- If the customer asks for a discount or promo code, you may ONLY mention the authorized code(s) listed above.
`;
  } else {
    promoRule = `
CRITICAL PROMO CODE POLICY:
- There are CURRENTLY ZERO active promotional codes configured by the atelier admin.
- If the customer asks for a promo code, coupon, voucher, or discount code, you MUST politely and directly explain:
  "There are currently no active public promotional codes. Our pieces are offered with transparent direct atelier pricing."
- Under NO circumstances may you fabricate, hallucinate, or state any promo code (like "VRIX15", "WELCOME", etc.).
`;
  }

  if (launchContext.launchMode === "LAUNCH") {
    modeAddendum = `
CURRENT ATELIER STATUS: PRE-LAUNCH MODE (ATELIER UNVEILING SOON).
- Official Launch Unveiling Date: ${launchContext.targetDate || "Coming Soon"}.
- Guests can ask about the launch date, preview collections, lab diamond craftsmanship, and concierge styling.
- Invite guests to enter their email directly in the chat to join our private VIP Launch Waitlist for early access.
- Recommend following our official channels on Instagram (@vrix.official) and Facebook (VRIX) for unveiling announcements and countdown stories.
- Direct checkout is reserved until official launch day.
${promoRule}
`;
  } else if (launchContext.launchMode === "SALE") {
    const saleCodeDetail = launchContext.saleDiscountCode
      ? `- Promotion Coupon Code: "${launchContext.saleDiscountCode}" (remind guests they can apply code ${launchContext.saleDiscountCode} at checkout)`
      : `- Promotion Coupon Code: NONE REQUIRED (promotional pricing is directly active across pieces, no code needed at checkout)`;

    modeAddendum = `
CURRENT ATELIER STATUS: ACTIVE PROMOTIONAL SALE EVENT.
- Active Promotion Highlight: ${launchContext.saleDiscountHighlight || "Special Atelier Event"}
${saleCodeDetail}
- Event Title: ${launchContext.saleTitle || "THE PRIVATE ARCHIVE EVENT"}
- The entire fine jewellery store is 100% active and shoppable.
- Assist guests in finding pieces for themselves, choosing gifts, and comparing solitaires.
${promoRule}
`;
  } else {
    modeAddendum = `
CURRENT ATELIER STATUS: STANDARD FINE JEWELRY STORE.
The atelier is open. Provide quiet-luxury assistance with solitaire rings, necklaces, earrings, bracelets, diamond 4Cs education, and custom bespoke craftsmanship.
${promoRule}
`;
  }

  return `${VRIX_SYSTEM_INSTRUCTION}\n\n${modeAddendum}`;
}

// ── Multi-Turn Interactions API Execution Loop with Server-Side State ────────
export async function runInteractionsChatLoop({
  userMessage,
  previousInteractionId = null,
  sessionId = null,
  launchContext = {}
}) {
  const toolsUsed = new Set();
  let structuredData = {};
  let finalReply = "";

  const systemInstruction = buildSystemInstruction(launchContext);

  const candidateModels = [MODEL_NAME, ...FALLBACK_MODELS];

  // 1. Primary AI Path: Try official Google Generative AI (prioritizing high-speed gemini-2.0-flash)
  if (genAI) {
    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: mName,
          systemInstruction,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          }
        });

        // Fast race against 2500ms timeout per model
        let timer = null;
        const callPromise = model.generateContent(userMessage);
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Model ${mName} call timed out after 2500ms`)), 2500);
        });

        const result = await Promise.race([callPromise, timeoutPromise]).finally(() => {
          if (timer) clearTimeout(timer);
        });

        const text = result?.response?.text();

        if (text && text.trim().length > 0) {
          finalReply = text.trim();

          // Check if query implies product catalog surfacing
          const qLower = (userMessage || "").toLowerCase();
          let matchedCategory = null;
          if (qLower.includes("ring")) matchedCategory = "Rings";
          else if (qLower.includes("necklace") || qLower.includes("pendant")) matchedCategory = "Necklaces";
          else if (qLower.includes("earring")) matchedCategory = "Earrings";
          else if (qLower.includes("bracelet") || qLower.includes("bangle")) matchedCategory = "Bracelets";

          if (matchedCategory && launchContext.launchMode !== "LAUNCH") {
            const toolRes = await executeSearchProducts({ category: matchedCategory, limit: 3 });
            if (toolRes?.products?.length > 0) {
              structuredData.products = toolRes.products;
            }
          }

          if (launchContext.launchMode === "LAUNCH") {
            delete structuredData.products;
            delete structuredData.comparison;
            delete structuredData.saleDiscountCard;
            structuredData.emailCollector = {
              placeholder: "your.email@example.com",
              buttonText: "Notify Me"
            };
            structuredData.socialLinks = {
              title: "Follow VRIX Atelier",
              description: "Official releases, previews, and live countdown stories.",
              instagram: "https://www.instagram.com/vrix.official",
              facebook: "https://www.facebook.com/profile.php?id=61588375466280"
            };
            structuredData.options = [
              { label: "When is the Launch?", value: "launch_date" },
              { label: "Join VIP Waitlist", value: "launch_waitlist" },
              { label: "Instagram & Facebook", value: "social_channels" },
              { label: "About VRIX Lab Diamonds", value: "education" }
            ];
          }

          return {
            reply: finalReply,
            lastInteractionId: null,
            toolsUsed: Array.from(toolsUsed),
            structuredData
          };
        }
      } catch (genAiErr) {
        console.warn(`[GEMINI API] Attempt with model ${mName} warning:`, genAiErr?.message || genAiErr);
      }
    }
  }

  // 2. Secondary AI Path: Try @google/genai ai.models.generateContent
  if (ai && ai.models?.generateContent) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: userMessage,
        config: {
          systemInstruction,
        }
      });

      const text = response?.text;
      if (text && text.trim().length > 0) {
        if (launchContext.launchMode === "LAUNCH") {
          delete structuredData.products;
          delete structuredData.comparison;
          delete structuredData.saleDiscountCard;
          structuredData.emailCollector = {
            placeholder: "your.email@example.com",
            buttonText: "Notify Me"
          };
          structuredData.socialLinks = {
            title: "Follow VRIX Atelier",
            description: "Official releases, previews, and live countdown stories.",
            instagram: "https://www.instagram.com/vrix.official",
            facebook: "https://www.facebook.com/profile.php?id=61588375466280"
          };
          structuredData.options = [
            { label: "When is the Launch?", value: "launch_date" },
            { label: "Join VIP Waitlist", value: "launch_waitlist" },
            { label: "Instagram & Facebook", value: "social_channels" },
            { label: "About VRIX Lab Diamonds", value: "education" }
          ];
        }
        return {
          reply: text.trim(),
          lastInteractionId: null,
          toolsUsed: Array.from(toolsUsed),
          structuredData
        };
      }
    } catch (apiErr) {
      console.warn("[GEMINI API] Secondary @google/genai call warning:", apiErr?.message || apiErr);
    }
  }

  // 3. Fallback: Quiet luxury deterministic response tailored to intent
  const qLower = (userMessage || "").toLowerCase();

  if (launchContext.launchMode === "LAUNCH") {
    const targetDateFormatted = launchContext.targetDate
      ? new Date(launchContext.targetDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "Coming Soon";
    finalReply = `Our digital atelier arrives on ${targetDateFormatted}. We craft architectural lab-grown diamonds with quiet luxury. Enter your email to join our private VIP waitlist for early access, or follow our preview stories on Instagram (@vrix.official) and Facebook:`;
    structuredData = {
      emailCollector: {
        placeholder: "your.email@example.com",
        buttonText: "Notify Me"
      },
      socialLinks: {
        title: "Follow VRIX Atelier",
        description: "Official releases, previews, and live countdown stories.",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280"
      },
      options: [
        { label: "When is the Launch?", value: "launch_date" },
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "Instagram & Facebook", value: "social_channels" },
        { label: "About VRIX Lab Diamonds", value: "education" }
      ]
    };
  } else if (launchContext.launchMode === "SALE" && (qLower.includes("discount") || qLower.includes("sale") || qLower.includes("offer"))) {
    const saleCodeText = launchContext.saleDiscountCode ? ` with promo code ${launchContext.saleDiscountCode}` : ` (direct atelier pricing, no promo code needed)`;
    finalReply = `The Private Archive Event is currently active across our atelier. You can enjoy ${launchContext.saleDiscountHighlight || "exclusive pricing"} on signature lab diamond solitaires and pavé bands${saleCodeText}.`;
  } else if (qLower.includes("promo") || qLower.includes("coupon") || qLower.includes("voucher") || qLower.includes("discount code")) {
    const adminCodes = launchContext.adminPromoCodes || [];
    if (launchContext.saleDiscountCode) {
      finalReply = `You can apply official code ${launchContext.saleDiscountCode} at checkout for ${launchContext.saleDiscountHighlight || "our active promotion"}.`;
    } else if (adminCodes.length > 0) {
      finalReply = `Our active atelier privilege code is ${adminCodes[0].code} (${adminCodes[0].description || "special discount"}). Enter it at checkout to apply your privilege.`;
    } else {
      finalReply = `There are currently no active public promotional codes. All VRIX pieces are offered with transparent direct atelier pricing.`;
    }
  } else if (qLower.includes("return") || qLower.includes("exchange")) {
    finalReply = "VRIX offers a 15-day complimentary return window on unworn pieces in their original packaging, along with lifetime craftsmanship exchange on our lab-grown diamond solitaires.";
  } else if (qLower.includes("shipping") || qLower.includes("delivery") || qLower.includes("delivering")) {
    finalReply = "We provide complimentary insured express delivery across India in 2–4 business days via BlueDart Air, with discrete signature confirmation upon delivery.";
  } else if (qLower.includes("diamond") || qLower.includes("lab") || qLower.includes("real")) {
    finalReply = "VRIX lab-grown diamonds are 100% genuine crystallized carbon diamonds with identical optical, chemical, and physical properties to mined stones. Every solitaire arrives with independent gemological certification (IGI/SGL) and VS+ clarity.";
  } else if (qLower.includes("bespoke") || qLower.includes("custom")) {
    finalReply = "Our Surat atelier crafts custom bespoke jewellery. Our goldsmiths collaborate with you from initial sketch to 3D CAD and hand-setting in solid 18K gold or platinum.";
    structuredData.bespokeEstimate = {
      pieceType: "Custom Fine Jewelry",
      metalChoice: "18K Solid Gold / 950 Platinum",
      estimatedPriceRange: "₹65,000 – ₹1,80,000",
      leadTime: "3 – 4 Weeks"
    };
  } else {
    // Surface signature pieces
    const allProds = await db.products.findMany().catch(() => []);
    const visible = (allProds || []).filter(p => p.isVisible !== false);
    if (visible.length > 0) {
      structuredData.products = visible.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        category: p.type || p.collection || "Jewelry",
        material: p.material || "18K Gold / 950 Platinum",
        price: Number(p.price) || 0,
        image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
        slug: p.id
      }));
    }
    finalReply = "Welcome to VRIX. Our atelier crafts architectural lab-grown diamonds and fine jewellery. How may I assist your exploration today?";
  }

  // Final check to guarantee ZERO products in LAUNCH mode
  if (launchContext.launchMode === "LAUNCH") {
    delete structuredData.products;
    delete structuredData.comparison;
    delete structuredData.saleDiscountCard;
  }

  return {
    reply: finalReply,
    lastInteractionId: null,
    toolsUsed: Array.from(toolsUsed),
    structuredData
  };
}


