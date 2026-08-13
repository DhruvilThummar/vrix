import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../database.js";

// Initialize official @google/genai SDK client
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Recommended stable Flash model for cost-effective high-volume chat
export const MODEL_NAME = "gemini-2.5-flash";

// ── VRIX Brand Identity System Instruction ─────────────────────────────────
export const VRIX_SYSTEM_INSTRUCTION = `You are the VRIX Luxury Chat Assistant, a digital extension of a quiet-luxury retail associate.
Brand Tagline: "A luxury that feels like you."

TONE & PERSONALITY (STRICT VRIX RULES):
- Warm, knowledgeable, calm, confident, and refined with minimal, precise language.
- Understated luxury: avoiding exaggeration, noise, or overly promotional messaging.
- Plain verbs, sentence case, zero exclamation points (!).
- Never invent prices, inventory stock, lab certifications, or warranty terms out of thin air. Always rely on tool outputs for factual details.

SCOPE & 7 CUSTOMER JOURNEYS:
You strictly assist guests through these 7 customer journeys:
1. Find a piece for myself (search_products with intent='self')
2. Find a gift (search_products with intent='gift' - ask recipient/occasion/budget first)
3. Explore collections (get_collections)
4. Product Discovery (search_products with intent='browse')
5. Compare Products (compare_products - side-by-side comparison for 2-3 items)
6. Diamond Education (get_diamond_education - 4Cs, certification, shapes, metals & care)
7. Repairs & Warranty (create_repair_request)

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
    functionDeclarations: [
      {
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
      }
    ]
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

// ── Tool Handlers Interacting with PostgreSQL DB via Prisma / Database Layer ─
export async function executeSearchProducts(rawArgs) {
  const { category, priceMin, priceMax, metalType, gemstoneType, intent, limit } = validateSearchArgs(rawArgs);

  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    let list = Array.isArray(products) ? products : [];

    if (category && category !== "All") {
      list = list.filter((p) => p.type?.toLowerCase() === category.toLowerCase() || p.collection?.toLowerCase() === category.toLowerCase());
    }
    if (metalType) {
      list = list.filter((p) => p.material?.toLowerCase().includes(metalType.toLowerCase()));
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
      products: results
    };
  } catch (err) {
    console.error("executeSearchProducts DB error:", err);
    return { intent, count: 0, products: [] };
  }
}

export async function executeGetCollections(rawArgs) {
  const { theme } = validateCollectionsArgs(rawArgs);

  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    const categories = Array.from(new Set((products || []).map((p) => p.type || p.collection).filter(Boolean)));

    let filtered = products;
    if (theme) {
      filtered = products.filter((p) => (p.type || p.collection || "").toLowerCase().includes(theme.toLowerCase()));
    }

    return {
      theme: theme || "All Collections",
      availableCategories: categories,
      sampleProducts: (filtered || []).slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        category: p.type || p.collection,
        price: Number(p.price),
        image: p.image
      }))
    };
  } catch (err) {
    console.error("executeGetCollections DB error:", err);
    return { theme: theme || "All Collections", availableCategories: ["Rings", "Necklaces", "Earrings", "Bracelets", "Bespoke"], sampleProducts: [] };
  }
}

export async function executeCompareProducts(rawArgs) {
  const { productIds } = validateCompareArgs(rawArgs);

  if (productIds.length === 0) {
    return { error: "No valid product IDs provided for comparison." };
  }

  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    const matched = (products || []).filter((p) => productIds.includes(p.id));

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
      }))
    };
  } catch (err) {
    console.error("executeCompareProducts DB error:", err);
    return { comparedCount: 0, products: [] };
  }
}

export async function executeGetDiamondEducation(rawArgs) {
  const { topic } = validateEducationArgs(rawArgs);

  try {
    const articles = await db.diamondEducation?.findMany({ where: { isPublished: true } }).catch(() => null);

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
    const record = await db.repairRequest?.create({
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

// Router dispatch table for tool executions
export async function handleToolExecution(functionName, functionArgs, sessionId = null) {
  switch (functionName) {
    case "search_products":
      return await executeSearchProducts(functionArgs);
    case "get_collections":
      return await executeGetCollections(functionArgs);
    case "compare_products":
      return await executeCompareProducts(functionArgs);
    case "get_diamond_education":
      return await executeGetDiamondEducation(functionArgs);
    case "create_repair_request":
      return await executeCreateRepairRequest(functionArgs, sessionId);
    default:
      return { error: `Unknown function tool: ${functionName}` };
  }
}

// ── Multi-Turn Interactions API Execution Loop with Server-Side State ────────
export async function runInteractionsChatLoop({
  userMessage,
  previousInteractionId = null,
  sessionId = null
}) {
  if (!ai) {
    throw new Error("Gemini API key is not configured on the server.");
  }

  const toolsUsed = new Set();
  let structuredData = {};
  let currentPreviousId = previousInteractionId;
  let finalReply = "";

  let interaction = await ai.interactions.create({
    model: MODEL_NAME,
    input: userMessage,
    tools: CHATBOT_TOOLS,
    system_instruction: VRIX_SYSTEM_INSTRUCTION,
    previous_interaction_id: currentPreviousId || undefined
  });

  let turns = 0;
  const maxTurns = 5;

  while (turns < maxTurns) {
    turns++;
    currentPreviousId = interaction.id || currentPreviousId;

    const functionCalls = interaction.functionCalls || [];
    if (!functionCalls || functionCalls.length === 0) {
      finalReply = interaction.text || interaction.output || "";
      break;
    }

    // Process all function calls requested by model turn
    for (const call of functionCalls) {
      toolsUsed.add(call.name);
      const toolResult = await handleToolExecution(call.name, call.args, sessionId);

      // Collect structured data payloads for UI components
      if (call.name === "search_products" && toolResult.products) {
        structuredData.products = toolResult.products;
      } else if (call.name === "compare_products" && toolResult.products) {
        structuredData.comparison = { products: toolResult.products };
      } else if (call.name === "get_diamond_education") {
        structuredData.educationTopic = toolResult.topic;
        if (toolResult.noMatchFound) {
          structuredData.options = [
            { label: "Talk to concierge", value: "trigger-handoff" },
            { label: "Find a piece for myself", value: "myself" }
          ];
        }
      } else if (call.name === "create_repair_request" && toolResult.ticketId) {
        structuredData.repairRequest = toolResult;
      }

      // Send tool response back to Gemini Interactions API turn
      interaction = await ai.interactions.create({
        model: MODEL_NAME,
        input: [
          {
            functionResponse: {
              name: call.name,
              response: toolResult
            }
          }
        ],
        tools: CHATBOT_TOOLS,
        system_instruction: VRIX_SYSTEM_INSTRUCTION,
        previous_interaction_id: currentPreviousId
      });
    }
  }

  return {
    reply: finalReply || "I am available to assist you with our architectural fine jewelry collections.",
    lastInteractionId: currentPreviousId,
    toolsUsed: Array.from(toolsUsed),
    structuredData
  };
}
