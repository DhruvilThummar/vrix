import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../database.js";

const router = express.Router();

// ── VRIX Quiet Luxury System Prompt & Grounding Anti-Hallucination Directive ──
const VRIX_SYSTEM_PROMPT = `
You are the VRIX Luxury Chat Assistant, a digital extension of a quiet-luxury retail associate.
Your brand tagline is: "Designed for the moments that belong only to you."

CRITICAL GROUNDING RULES (STRICT ANTI-HALLUCINATION RAG):
1. You MUST answer strictly and only using the [PRODUCT CONTEXT] provided below.
2. If the user asks about a product, price, material, or policy that is NOT explicitly mentioned in the [PRODUCT CONTEXT], you MUST say exactly: "I apologize, but I do not have that specific information in our current catalog. Please connect with our concierge for bespoke requests."
3. DO NOT invent, guess, or assume prices, materials, discounts, or inventory status under any circumstances.
4. All product prices in the [PRODUCT CONTEXT] are already converted and formatted for the user's currency. You MUST present prices strictly as shown in [PRODUCT CONTEXT].

VOICE & TONE (STRICT):
- Warm, restrained, and confident. Plain verbs, sentence case.
- ABSOLUTELY ZERO exclamation points (!). Do not use them under any circumstances.
- Zero fluff. Be polite, concise, and direct.

OUTPUT FORMAT (STRICT JSON ONLY):
You must ALWAYS respond in valid JSON format only. Do not wrap in markdown \`\`\`json.
Your JSON must strictly follow this structure:

{
  "botText": "Your quiet-luxury response here.",
  "productCards": [
    {
      "productId": "id_from_context",
      "name": "Product Name",
      "price": "Formatted price from context",
      "reason": "One short sentence explaining why this fits."
    }
  ],
  "actionChips": ["Chip Label 1", "Chip Label 2"]
}
If no products in context are relevant, leave "productCards" empty []. Provide 2-3 logical actionChips matching user intent.
`;

// ── Currency Price Formatting Helper ───────────────────────────────────────
function formatCurrencyPrice(inrAmount, currency = "INR", symbol = "₹", rate = 1, locale = "en-IN") {
  const num = Number(inrAmount);
  if (isNaN(num) || num <= 0) return `${symbol}0`;
  const converted = num * (rate || 1);
  if (currency === "INR") {
    return `${symbol}${Math.round(converted).toLocaleString(locale || "en-IN")}`;
  }
  return `${symbol}${Number(converted.toFixed(2)).toLocaleString(locale || "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── 1. Intent Routing Classifier ───────────────────────────────────────────
async function classifyIntent(userText, actionValue = "", currentFlow = "") {
  const combined = `${actionValue} ${userText} ${currentFlow}`.toLowerCase();

  // Rule-based fast routing for support & concierge FAQs
  if (
    combined.includes("concierge") ||
    combined.includes("trigger-handoff") ||
    combined.includes("repair") ||
    combined.includes("warranty") ||
    combined.includes("bespoke") ||
    combined.includes("4cs") ||
    combined.includes("sourcing") ||
    combined.includes("metal purity") ||
    combined.includes("contact")
  ) {
    return "FAQ_OR_SUPPORT";
  }

  if (
    combined.includes("gift") ||
    combined.includes("mother") ||
    combined.includes("partner") ||
    combined.includes("spouse") ||
    combined.includes("friend") ||
    combined.includes("parent") ||
    combined.includes("colleague") ||
    combined.includes("wife") ||
    combined.includes("husband") ||
    currentFlow === "gift"
  ) {
    return "GIFT_GUIDE";
  }

  return "PRODUCT_SEARCH";
}

// ── 2. Query Expansion for GIFT_GUIDE ──────────────────────────────────────
async function expandGiftQuery(userText, apiKey) {
  const prompt = `You are a luxury jewelry search query expansion engine.
Convert the user's gift prompt or recipient label "${userText}" into a rich, descriptive product search query for a pgvector database.
Include descriptive attributes like: "Best luxury fine jewelry pieces suitable as a gift, elegant, timeless, refined signature necklace, earrings, or ring."
Output ONLY the expanded search sentence as a single line. Do not wrap in quotes or JSON.`;

  if (!apiKey) {
    return `Best luxury fine jewelry pieces suitable as a gift for ${userText}, elegant and timeless.`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response?.text();
    if (text && text.trim().length > 5) {
      return text.trim().replace(/^["']|["']$/g, "");
    }
  } catch (err) {
    console.error("Gift query expansion error:", err);
  }

  return `Best luxury fine jewelry pieces suitable as a gift for ${userText}, elegant and timeless.`;
}

// ── Search Query Optimizer for General Queries ─────────────────────────────
const SEARCH_OPTIMIZER_PROMPT = `
You are a search query optimizer for a luxury jewelry store database.
Your task is to convert the user's conversational message into a highly effective, keyword-rich search string for a Vector/Cosine similarity search.

Instructions:
1. Remove all conversational filler words (e.g., "show me", "I want", "looking for").
2. Extract the core intent: Category (ring, necklace, earrings, bracelet), Material (gold, silver, diamond), Occasion (gift, wedding), and Budget attributes.
3. Output ONLY the extracted search keywords as a single line. Do not wrap in JSON or quotes.
`;

async function optimizeSearchQuery(userMessage, apiKey) {
  if (!apiKey || !userMessage || userMessage.trim().length === 0) return userMessage;

  const prompt = `${SEARCH_OPTIMIZER_PROMPT}\n\nUser Message: "${userMessage}"`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response?.text();
    if (text) {
      return text.trim().replace(/^["']|["']$/g, "");
    }
  } catch (err) {
    // Return original message gracefully on error
  }
  return userMessage;
}

// ── Vector Embedding Generator via Gemini text-embedding-004 ───────────────
async function generateGeminiEmbedding(text, apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.embedding?.values || null;
  } catch (err) {
    console.error("Gemini embedding error:", err);
    return null;
  }
}

// ── Supabase RPC match_products Vector Similarity Search ───────────────────
async function searchSupabaseRpc(searchQuery, currencyConfig) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!supabaseUrl || !supabaseKey || !apiKey) return null;

  try {
    const queryVector = await generateGeminiEmbedding(searchQuery, apiKey);
    if (!queryVector) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: matched, error } = await supabase.rpc("match_products", {
      query_embedding: queryVector,
      match_threshold: 0.25,
      match_count: 4,
    });

    if (error || !matched || matched.length === 0) return null;

    return matched.map((p) => {
      const rawPrice = Number(p.price) || 0;
      const formattedPrice = formatCurrencyPrice(
        rawPrice,
        currencyConfig.currency,
        currencyConfig.symbol,
        currencyConfig.rate,
        currencyConfig.locale
      );

      return {
        id: p.id,
        title: p.title,
        category: p.type || p.category || "Jewelry",
        material: p.material || "18K Gold / Sterling Silver",
        rawPrice,
        formattedPrice,
        price: rawPrice,
        image: p.image || p.image_url || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
        whyFits: `Architectural ${p.material || 'minimal'} design, perfect for quiet luxury.`,
        slug: p.id,
      };
    });
  } catch (err) {
    console.error("Supabase RPC vector search exception:", err);
    return null;
  }
}

// ── Local Fallback Vector Similarity Search over Database ──────────────────
function computeTextVector(text = "") {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const tf = {};
  for (const w of words) tf[w] = (tf[w] || 0) + 1;
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (const k in vecA) {
    normA += vecA[k] * vecA[k];
    if (vecB[k]) dotProduct += vecA[k] * vecB[k];
  }
  for (const k in vecB) normB += vecB[k] * vecB[k];
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchLocalDbProducts(userQuery, currencyConfig, limit = 4) {
  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    if (!products || products.length === 0) return [];

    const queryVec = computeTextVector(userQuery);
    const scored = products.map((p) => {
      const docText = `${p.title} ${p.material || ""} ${p.type || ""} ${p.collection || ""} ${p.description || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`;
      const docVec = computeTextVector(docText);
      const score = cosineSimilarity(queryVec, docVec);
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ product: p }) => {
      const rawPrice = Number(p.price) || 0;
      const formattedPrice = formatCurrencyPrice(
        rawPrice,
        currencyConfig.currency,
        currencyConfig.symbol,
        currencyConfig.rate,
        currencyConfig.locale
      );

      return {
        id: p.id,
        title: p.title,
        category: p.type || p.collection || "Jewelry",
        material: p.material || "18K Gold / Sterling Silver",
        rawPrice,
        formattedPrice,
        price: rawPrice,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        stone: p.description?.includes("Diamond") ? "Ethical Conflict-Free Diamond" : "Consciously Sourced Gem",
        warranty: "Lifetime Craftsmanship Guarantee",
        image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
        whyFits: `Architectural ${p.material || 'minimal'} design, perfect for quiet luxury.`,
        slug: p.id,
      };
    });
  } catch (err) {
    console.error("Local DB product search error:", err);
    return null;
  }
}

// ── Complete generateGeminiRagResponse Function ───────────────────────────
export async function generateGeminiRagResponse(userPrompt, retrievedProducts, currencyConfig) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const contextData = (retrievedProducts || [])
    .map(
      (p) =>
        `ID: ${p.id} | Name: ${p.title || p.name} | Category: ${p.category || p.type || "Jewelry"} | Material: ${p.material || "18K Gold / Sterling Silver"} | Price: ${p.formattedPrice || p.price} | Description: ${p.description || p.whyFits || "Architectural minimal design"}`
    )
    .join("\n");

  const fullPrompt = `${VRIX_SYSTEM_PROMPT}

User Currency: ${currencyConfig.currency} (${currencyConfig.symbol})

[PRODUCT CONTEXT]
${contextData || "No direct product matches found in catalog."}

User Question: "${userPrompt}"
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(fullPrompt);
    const rawText = result.response?.text();
    if (rawText) {
      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    }
  } catch (sdkErr) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          return JSON.parse(cleanJson);
        }
      }
    } catch (restErr) {
      console.error("Gemini RAG REST call error:", restErr);
    }
  }

  return null;
}

// ── Concierge & Static Support Data Provider ──────────────────────────────
function getHandoffData() {
  return {
    title: "VRIX Concierge Service",
    description: "Quiet luxury consultation, order inquiries, and bespoke guidance.",
    phone: "+91 90542 85693",
    instagram: "https://www.instagram.com/vrix.official",
    linkedin: "https://www.linkedin.com/company/vrixjewels",
    mapsUrl: "https://share.google/EjrRFPTc3O06labrR",
    businessProfileUrl: "https://share.google/EXKbHCShaIvgQemwL",
  };
}

// ── POST /api/chat/query — Production Refactored RAG Endpoint ──────────────
router.post("/query", async (req, res) => {
  const {
    actionValue,
    userLabel,
    currentFlow,
    step,
    data,
    query,
    userMessage,
    currency = "INR",
    symbol = "₹",
    rate = 1,
    locale = "en-IN",
    country = "IN",
  } = req.body || {};

  const currencyConfig = { currency, symbol, rate: Number(rate) || 1, locale, country };
  const userText = (userMessage || query || userLabel || actionValue || "show jewelry").trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const isoTimestamp = new Date().toISOString(); // Strict ISO 8601 UTC

  // ── 1. Intent Classification ──
  const intent = await classifyIntent(userText, actionValue, currentFlow);

  // ── 2. Handle FAQ_OR_SUPPORT (Bypasses pgvector completely) ──
  if (intent === "FAQ_OR_SUPPORT") {
    const combined = `${actionValue} ${userText}`.toLowerCase();

    if (combined.includes("bespoke")) {
      const minVal = formatCurrencyPrice(65000, currencyConfig.currency, currencyConfig.symbol, currencyConfig.rate, currencyConfig.locale);
      const maxVal = formatCurrencyPrice(180000, currencyConfig.currency, currencyConfig.symbol, currencyConfig.rate, currencyConfig.locale);

      return res.json({
        success: true,
        rag: { intent, bypassedVector: true },
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "bot",
            text: "Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.",
            bespokeEstimate: {
              pieceType: userLabel || actionValue || "Custom Fine Jewelry",
              metalChoice: "18K Solid Gold / 950 Platinum",
              estimatedPriceRange: `${minVal} – ${maxVal}`,
              leadTime: "3 – 4 Weeks",
            },
            options: [
              { label: "Book Atelier Consultation", value: "trigger-handoff" },
              { label: "Find a piece for myself", value: "myself" },
              { label: "Explore collections", value: "collections" },
            ],
            timestamp: isoTimestamp,
          },
        ],
      });
    }

    if (combined.includes("repair") || combined.includes("warranty")) {
      return res.json({
        success: true,
        rag: { intent, bypassedVector: true },
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "bot",
            text: "All VRIX creations are backed by our Lifetime Craftsmanship Guarantee. We provide complimentary ring resizing, gemstone claw inspection, and surface refinishing.",
            handoff: getHandoffData(),
            options: [
              { label: "Talk to concierge", value: "trigger-handoff" },
              { label: "Find a piece for myself", value: "myself" },
              { label: "Explore collections", value: "collections" },
            ],
            timestamp: isoTimestamp,
          },
        ],
      });
    }

    // Default Concierge Handoff
    return res.json({
      success: true,
      rag: { intent, bypassedVector: true },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "Connect directly with our quiet luxury retail associate team for bespoke inquiries and personalized service:",
          handoff: getHandoffData(),
          options: [
            { label: "Find a piece for myself", value: "myself" },
            { label: "Find a gift", value: "gift" },
            { label: "Explore collections", value: "collections" },
          ],
          timestamp: isoTimestamp,
        },
      ],
    });
  }

  // ── 3. Handle Guided Flow Entry Points ──
  if (actionValue === "myself" || userLabel === "Find a Piece for Myself") {
    return res.json({
      success: true,
      nextState: { currentFlow: "myself", step: 2, data: {} },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "What are you shopping for?",
          options: [
            { label: "Necklaces", value: "Necklaces" },
            { label: "Earrings", value: "Earrings" },
            { label: "Rings", value: "Rings" },
            { label: "Bracelets", value: "Bracelets" },
            { label: "Not sure yet", value: "All" },
          ],
          timestamp: isoTimestamp,
        },
      ],
    });
  }

  if (actionValue === "gift" || userLabel === "Find a Gift") {
    return res.json({
      success: true,
      nextState: { currentFlow: "gift", step: 2, data: {} },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "Who is this gift for?",
          options: [
            { label: "Partner / Spouse", value: "Partner" },
            { label: "Mother", value: "Mother" },
            { label: "Friend", value: "Friend" },
            { label: "Skip step", value: "skip" },
          ],
          timestamp: isoTimestamp,
        },
      ],
    });
  }

  if (actionValue === "collections" || userLabel === "Explore Collections") {
    return res.json({
      success: true,
      nextState: { currentFlow: "collections", step: 1, data: {} },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "Select a collection category to explore:",
          options: [
            { label: "Necklaces", value: "Necklaces" },
            { label: "Earrings", value: "Earrings" },
            { label: "Rings", value: "Rings" },
            { label: "Bracelets", value: "Bracelets" },
            { label: "Bespoke", value: "Bespoke" },
          ],
          timestamp: isoTimestamp,
        },
      ],
    });
  }

  // ── 4. Query Preparation (Query Expansion vs Optimizer) ──
  let searchQuery = userText;
  if (intent === "GIFT_GUIDE") {
    searchQuery = await expandGiftQuery(userText, apiKey);
  } else {
    searchQuery = await optimizeSearchQuery(userText, apiKey);
  }

  // ── 5. Vector Search (Supabase RPC -> Local DB Fallback) ──
  let retrievedProducts = await searchSupabaseRpc(searchQuery, currencyConfig);

  if (!retrievedProducts) {
    retrievedProducts = await searchLocalDbProducts(searchQuery, currencyConfig);
  }

  // ── 6. RAG Response Generation via Gemini ──
  const geminiJson = await generateGeminiRagResponse(userText, retrievedProducts, currencyConfig);

  let botText = "Here are architectural pieces selected for you from our live catalog:";
  let displayProducts = (retrievedProducts && retrievedProducts.length > 0) ? retrievedProducts : undefined;
  let options = [
    { label: "Find a piece for myself", value: "myself" },
    { label: "Find a gift", value: "gift" },
    { label: "Explore collections", value: "collections" },
    { label: "Talk to concierge", value: "trigger-handoff" },
  ];

  if (geminiJson) {
    if (geminiJson.botText) {
      botText = geminiJson.botText.replace(/!/g, ".");
    }
    if (Array.isArray(geminiJson.actionChips) && geminiJson.actionChips.length > 0) {
      options = geminiJson.actionChips.map((chip) => ({
        label: String(chip).replace(/!/g, ""),
        value: String(chip).toLowerCase().includes("bespoke")
          ? "Bespoke"
          : String(chip).toLowerCase().includes("gift")
          ? "gift"
          : "myself",
      }));
    }
    if (Array.isArray(geminiJson.productCards) && geminiJson.productCards.length > 0) {
      displayProducts = geminiJson.productCards.map((card) => {
        const matched = (retrievedProducts || []).find((p) => p.id === card.productId);
        const rawPrice = matched?.rawPrice || (typeof card.price === "number" ? card.price : parseInt(card.price) || 25000);
        const formattedPrice = formatCurrencyPrice(
          rawPrice,
          currencyConfig.currency,
          currencyConfig.symbol,
          currencyConfig.rate,
          currencyConfig.locale
        );

        return {
          id: card.productId || matched?.id || `card-${Math.random()}`,
          title: card.name || matched?.title || "Signature Piece",
          category: matched?.category || "Jewelry",
          material: matched?.material || "18K Solid Gold",
          price: rawPrice,
          formattedPrice: formattedPrice,
          image: matched?.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
          whyFits: card.reason ? card.reason.replace(/!/g, ".") : matched?.whyFits,
          slug: matched?.slug || card.productId,
        };
      });
    }
  }

  res.json({
    success: true,
    rag: {
      intent,
      vectorRetrievedCount: (retrievedProducts || []).length,
      geminiUsed: !!geminiJson,
      searchQuery,
      currency: currencyConfig.currency,
    },
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: botText,
        products: displayProducts,
        options,
        timestamp: isoTimestamp,
      },
    ],
  });
});

// ── GET /api/chat/health — Status Check ───────────────────────────────────────
router.get("/health", (req, res) => {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
  res.json({
    status: "ok",
    ragEngine: "Supabase RPC match_products + Gemini text-embedding-004 + Intent Router + Query Expander",
    supabaseConfigured: hasSupabase,
    geminiConfigured: hasGeminiKey,
  });
});

export default router;

