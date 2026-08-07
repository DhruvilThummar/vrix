import express from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../database.js";

const router = express.Router();

// ── VRIX Quiet Luxury System Prompt ─────────────────────────────────────────
const VRIX_SYSTEM_PROMPT = `
You are the VRIX Luxury Chat Assistant, a digital extension of a quiet-luxury retail associate.
Your brand tagline is: "Designed for the moments that belong only to you."

VOICE & TONE GUIDELINES (STRICT):
- Maintain a warm, restrained, and confident tone.
- Use plain verbs and sentence case.
- ABSOLUTELY ZERO exclamation points (!). Do not use them under any circumstances.
- Zero fluff. Be polite but highly concise and direct.

YOUR CORE DIRECTIVES:
1. Grounding: Answer customer questions STRICTLY based on the provided [PRODUCT CONTEXT]. Do not hallucinate prices, materials, or policies.
2. Recommendations: When recommending a product, include a brief, tailored "why this fits" reasoning based on their request (e.g., occasion, budget, feel).
3. Diamond/Material Education: Provide plain, factual guidance on the 4Cs and metal purities if asked, emphasizing VRIX's conflict-free ethical sourcing.
4. Fallback: If a user asks something outside the provided context, politely route them to the human concierge or bespoke atelier.

OUTPUT FORMAT (STRICT JSON):
You must ALWAYS respond in valid JSON format only. Do not include markdown formatting like \`\`\`json.
Your JSON must strictly follow this structure:

{
  "botText": "Your elegant, quiet-luxury response here. (No exclamation marks)",
  "productCards": [
    {
      "productId": "id_from_context",
      "name": "Product Name",
      "price": "Price from context",
      "reason": "One short sentence explaining why this fits."
    }
  ],
  "actionChips": ["Explore Necklaces", "Bespoke Consultation"] 
}
If no products are relevant, leave the "productCards" array empty []. Provide 2-3 logical next steps in "actionChips".
`;

// ── Vector Embedding Generator via Gemini text-embedding-004 ───────────────
async function generateGeminiEmbedding(text, apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.embedding?.values || null;
  } catch (err) {
    console.error("Gemini embedding error:", err);
    return null;
  }
}

// ── Supabase RPC match_products Vector Similarity Search ───────────────────
async function searchSupabaseRpc(userMessage) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!supabaseUrl || !supabaseKey || !apiKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const queryVector = await generateGeminiEmbedding(userMessage, apiKey);
    if (!queryVector) return null;

    const { data: matched, error } = await supabase.rpc("match_products", {
      query_embedding: queryVector,
      match_threshold: 0.3,
      match_count: 4,
    });

    if (error || !matched || matched.length === 0) return null;

    return matched.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.type || p.category || "Jewelry",
      material: p.material || "18K Gold / Sterling Silver",
      price: Number(p.price) || 0,
      image: p.image || p.image_url || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
      whyFits: `Architectural ${p.material || 'minimal'} design, perfect for quiet luxury.`,
      slug: p.id,
    }));
  } catch (err) {
    console.error("Supabase RPC vector search exception:", err);
    return null;
  }
}

// ── Local Fallback Vector Similarity Search over Prisma / Database ──────────
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

async function searchLocalDbProducts(userQuery, categoryFilter, maxPrice, limit = 4) {
  try {
    const products = await db.products.findMany({ where: { isVisible: true } });
    if (!products || products.length === 0) return [];

    const queryVec = computeTextVector(userQuery);
    const scored = products.map((p) => {
      const docText = `${p.title} ${p.material || ""} ${p.type || ""} ${p.collection || ""} ${p.description || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`;
      const docVec = computeTextVector(docText);
      let score = cosineSimilarity(queryVec, docVec);
      if (categoryFilter && p.type && p.type.toLowerCase().includes(categoryFilter.toLowerCase())) score += 0.5;
      if (maxPrice && Number(p.price) <= maxPrice) score += 0.2;
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ product: p }) => ({
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
    console.error("Local DB product search error:", err);
    return null;
  }
}

// ── Gemini 1.5 Flash Model RAG Generator with Strict JSON Parsing ──────────
async function generateGeminiRagResponse(userPrompt, retrievedProducts) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const contextData = (retrievedProducts || [])
    .map((p) => `ID: ${p.id} | Name: ${p.title} | Category: ${p.category} | Material: ${p.material} | Price: ₹${p.price} | Reason: ${p.whyFits}`)
    .join("\n");

  const fullPrompt = `${VRIX_SYSTEM_PROMPT}

[PRODUCT CONTEXT]
${contextData || "No direct product matches found."}

User Question: "${userPrompt}"
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
      }
    }
  } catch (err) {
    console.error("Gemini API call error:", err);
  }

  return null;
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── POST /api/chat/query — Production RAG Endpoint ─────────────────────────
router.post("/query", async (req, res) => {
  const { actionValue, userLabel, currentFlow, step, data, query, userMessage } = req.body || {};
  const userText = userMessage || query || userLabel || actionValue || "show jewelry";
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

  // Step 1: Try Supabase RPC match_products vector search first
  let retrievedProducts = await searchSupabaseRpc(userText);

  // Step 2: Fallback to local DB vector search if Supabase RPC returned null
  if (!retrievedProducts) {
    retrievedProducts = await searchLocalDbProducts(userText, categoryFilter, maxPrice);
  }

  // High-Volume Busy Fallback Error Handling if DB and fallback fail completely
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

  // Step 3: Call Gemini 1.5 Flash Model RAG Generator
  const geminiJson = await generateGeminiRagResponse(userText, retrievedProducts);

  let botText = "Welcome to VRIX. Tell me who this is for and the occasion, and I'll narrow it down.";
  let displayProducts = retrievedProducts.length ? retrievedProducts : undefined;
  let options = [
    { label: "Find a piece for myself", value: "myself" },
    { label: "Find a gift", value: "gift" },
    { label: "Compare these pieces", value: "trigger-compare" },
    { label: "Talk to concierge", value: "trigger-handoff" },
  ];

  if (geminiJson) {
    if (geminiJson.botText) {
      // Remove any trailing exclamation marks to enforce strict quiet luxury tone
      botText = geminiJson.botText.replace(/!/g, ".");
    }
    if (Array.isArray(geminiJson.actionChips) && geminiJson.actionChips.length > 0) {
      options = geminiJson.actionChips.map((chip) => ({
        label: String(chip).replace(/!/g, ""),
        value: String(chip).toLowerCase().includes("bespoke") ? "Bespoke" : String(chip).toLowerCase().includes("gift") ? "gift" : "myself",
      }));
    }
    if (Array.isArray(geminiJson.productCards) && geminiJson.productCards.length > 0) {
      displayProducts = geminiJson.productCards.map((card) => {
        const matched = retrievedProducts.find((p) => p.id === card.productId);
        return {
          id: card.productId || matched?.id || `card-${Math.random()}`,
          title: card.name || matched?.title || "Signature Piece",
          category: matched?.category || "Jewelry",
          material: matched?.material || "18K Solid Gold",
          price: matched?.price || (typeof card.price === "number" ? card.price : parseInt(card.price) || 25000),
          image: matched?.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
          whyFits: card.reason ? card.reason.replace(/!/g, ".") : matched?.whyFits,
          slug: matched?.slug || card.productId,
        };
      });
    }
  } else if (retrievedProducts.length > 0) {
    botText = "Here are architectural pieces selected for you from our live catalog:";
  }

  res.json({
    success: true,
    rag: {
      vectorRetrievedCount: retrievedProducts.length,
      geminiUsed: !!geminiJson,
    },
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: botText,
        products: displayProducts,
        options,
        timestamp: time,
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
    ragEngine: "Supabase RPC match_products + Gemini text-embedding-004 + Gemini 1.5 Flash",
    supabaseConfigured: hasSupabase,
    geminiConfigured: hasGeminiKey,
  });
});

export default router;
