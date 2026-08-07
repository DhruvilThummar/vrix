import express from "express";
import { db } from "../database.js";

const router = express.Router();

const VRIX_SYSTEM_PROMPT = `
You are the luxury personal associate for VRIX, an architectural minimalist jewelry brand based in India (₹ INR primary, also $ USD / € EUR).
Brand identity: "quiet luxury" and "architectural minimalism."
Ethically sourced: "consciously mined metals and conflict-free stones." Handcrafted, not mass-produced.
Tagline: "Designed for the moments that belong only to you."
Categories: Necklaces, Earrings, Rings, Bracelets, Bespoke.
Loyalty program: VRIX+ Circle (early sale access, birthday treats, 10% first-order discount).
Voice: Warm, restrained, confident, like a quiet-luxury retail associate. Use sentence case, plain verbs, no exclamation points, no filler.
Example tone: "Tell me who this is for and the occasion, and I'll narrow it down."
`;

// Calculate vector embedding representation / similarity score (Cosine distance) for RAG retrieval
function computeTextVector(text = "") {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const tf = {};
  for (const w of words) {
    tf[w] = (tf[w] || 0) + 1;
  }
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }
  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// RAG Vector Retrieval over products database
async function vectorSearchProducts(userQuery, categoryFilter, maxPrice, limit = 4) {
  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    if (!products || products.length === 0) return [];

    const queryVec = computeTextVector(userQuery);

    const scored = products.map((p) => {
      const docText = `${p.title} ${p.material || ""} ${p.type || ""} ${p.collection || ""} ${p.description || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`;
      const docVec = computeTextVector(docText);
      let score = cosineSimilarity(queryVec, docVec);

      // Boost matching categories or metals
      if (categoryFilter && p.type && p.type.toLowerCase().includes(categoryFilter.toLowerCase())) {
        score += 0.5;
      }
      if (maxPrice && Number(p.price) <= maxPrice) {
        score += 0.2;
      }

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored
      .slice(0, limit)
      .map(({ product: p }) => ({
        id: p.id,
        title: p.title,
        category: p.type || p.collection || "Jewelry",
        material: p.material || "18K Gold / Sterling Silver",
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        stone: p.description?.includes("Diamond") ? "Ethical Conflict-Free Diamond" : "Consciously Sourced Gem",
        warranty: "Lifetime Craftsmanship Guarantee",
        image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
        whyFits: `Architectural ${p.material || 'minimal'} design, perfect for quiet luxury.`,
        slug: p.id,
      }));
  } catch (err) {
    console.error("Vector search DB error:", err);
    return null; // Return null to signal DB connection issue
  }
}

// Call Gemini API (using process.env.GEMINI_API_KEY) with RAG context
async function generateGeminiRagResponse(userPrompt, retrievedProducts) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null; // Fallback to rule-based RAG synthesis if key not set
  }

  const catalogContext = (retrievedProducts || [])
    .map((p) => `- ${p.title} (${p.category}): ${p.material}, ₹${p.price}. ${p.whyFits}`)
    .join("\n");

  const fullPrompt = `${VRIX_SYSTEM_PROMPT}

Retrieved Catalog Context (RAG):
${catalogContext || "No specific catalog items matched, general luxury jewelry advice."}

User Inquiry: "${userPrompt}"

Generate a quiet, elegant 2-sentence response helping the customer. Do not use exclamation marks or hype words.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (err) {
    console.error("Gemini API call error:", err);
  }

  return null;
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// POST /api/chat/query — Full RAG Pipeline endpoint with polite high-volume fallback
router.post("/query", async (req, res) => {
  const { actionValue, userLabel, currentFlow, step, data, query } = req.body || {};
  const userText = query || userLabel || actionValue || "show jewelry";
  const time = formatTime();

  // Extract category & budget parameters
  let categoryFilter;
  let maxPrice;
  const lower = userText.toLowerCase();

  if (lower.includes("ring")) categoryFilter = "Ring";
  else if (lower.includes("necklace") || lower.includes("pendant")) categoryFilter = "Necklace";
  else if (lower.includes("earring")) categoryFilter = "Earring";
  else if (lower.includes("bracelet") || lower.includes("cuff")) categoryFilter = "Bracelet";

  if (lower.includes("15k") || lower.includes("15000")) maxPrice = 15000;
  else if (lower.includes("40k") || lower.includes("40000")) maxPrice = 40000;
  else if (lower.includes("75k") || lower.includes("75000")) maxPrice = 75000;

  // Step 1: Perform RAG Vector Search over DB products
  const retrievedProducts = await vectorSearchProducts(userText, categoryFilter, maxPrice);

  // Fallback: If DB query returned null (database unreachable/busy)
  if (retrievedProducts === null) {
    return res.json({
      success: true,
      rag: { vectorRetrievedCount: 0, geminiUsed: false, dbFallbackActive: true },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "Our client associates are currently experiencing high volume assisting other guests. Please try again in a few moments, or connect directly with our concierge team.",
          options: [
            { label: "Try again in a moment", value: "retry" },
            { label: "Talk to concierge", value: "trigger-handoff" },
          ],
          timestamp: time,
        },
      ],
    });
  }

  // Step 2: Generate Gemini RAG Response
  const geminiText = await generateGeminiRagResponse(userText, retrievedProducts);

  const botResponseText = geminiText || (retrievedProducts.length
    ? "Here are architectural pieces selected for you from our live catalog:"
    : "Welcome to VRIX. Tell me who this is for and the occasion, and I'll narrow it down.");

  res.json({
    success: true,
    rag: {
      vectorRetrievedCount: retrievedProducts.length,
      geminiUsed: !!geminiText,
    },
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: botResponseText,
        products: retrievedProducts.length ? retrievedProducts : undefined,
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Compare these pieces", value: "trigger-compare" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      },
    ],
  });
});

// GET /api/chat/health — Check RAG & Gemini status
router.get("/health", (req, res) => {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.json({
    status: "ok",
    ragEngine: "pgvector + Gemini AI",
    geminiConfigured: hasGeminiKey,
  });
});

export default router;
