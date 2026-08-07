# VRIX Luxury Chat Assistant — Production Technical Documentation

Welcome to the official technical documentation for the **VRIX Floating Luxury Chat Widget** and its **Gemini AI + Supabase pgvector RAG Backend Engine**.

---

## 📌 1. Executive Summary & Brand Identity

The VRIX Chat Assistant is designed as a digital extension of a quiet-luxury retail associate. It rejects generic, hyper-enthusiastic AI chatbot conventions in favor of a warm, restrained, and confident tone.

- **Brand Tagline**: *"Designed for the moments that belong only to you."*
- **Voice Guidelines**: Plain verbs, sentence case, zero exclamation points, zero fluff.
- **Visual Design**: Strict adherence to VRIX design tokens (Tailwind CSS v4 `@theme`), custom font pairing (`Inter` + `Jost`), Material Symbols Outlined iconography (weight 200), and a signature **restrained glint motion** effect.

---

## 🏗️ 2. End-to-End System Architecture

The assistant uses a **Retrieval-Augmented Generation (RAG)** pipeline:

```
┌──────────────────────────┐          ┌──────────────────────────┐
│  VRIX Frontend (Next.js) │          │   VRIX Backend (Node.js) │
│  - VrixChatWidget        │          │   - /api/chat/query      │
│  - Tailwind v4 Tokens    │          │   - Search Query Optimizer   │
│  - LocalStorage Memory   │          │   - Supabase RPC Match   │
└────────────┬─────────────┘          └────────────┬─────────────┘
             │                                     │
             │ 1. POST /api/chat/query             │ 2. Preprocess prompt via
             ├────────────────────────────────────>│    Search Query Optimizer
             │                                     │ 3. Embed keywords via
             │                                     │    Gemini text-embedding-004
             │                                     │ 4. Execute match_products RPC
             │                                     │ 5. Build [PRODUCT CONTEXT]
             │                                     │ 6. Call Gemini 1.5 Flash
             │                                     │    with Strict JSON Schema
             │                                     │
             │ 7. Parsed JSON Response             │
             │    (botText, productCards, chips)   │
             │<────────────────────────────────────┤
             v                                     v
```

---

## 🤖 3. Gemini System Prompt & Output Schema

The backend sends this system prompt and forces strict JSON schema generation (`responseMimeType: "application/json"`):

```text
You are the VRIX Luxury Chat Assistant, a digital extension of a quiet-luxury retail associate.
Your brand tagline is: "Designed for the moments that belong only to you."

CRITICAL GROUNDING RULES (ANTI-HALLUCINATION):
1. You MUST answer strictly and only using the [PRODUCT CONTEXT] provided below.
2. If the user asks about a product, price, or policy that is NOT explicitly mentioned in the [PRODUCT CONTEXT], you MUST say exactly: "I apologize, but I do not have that specific information in our current catalog. Please connect with our concierge for bespoke requests."
3. DO NOT invent, guess, or assume prices, materials, discounts, or inventory status.
4. DO NOT bring in outside general knowledge about jewelry to answer specific inventory questions.

VOICE & TONE (STRICT):
- Warm, restrained, and confident. Plain verbs, sentence case.
- ABSOLUTELY ZERO exclamation points (!).
- Zero fluff.

OUTPUT FORMAT (STRICT JSON):
{
  "botText": "Your quiet-luxury response here.",
  "productCards": [
    {
      "productId": "id_from_context",
      "name": "Product Name",
      "price": "Price from context",
      "reason": "One short sentence explaining why this fits."
    }
  ],
  "actionChips": ["Chip 1", "Chip 2"]
}
```

---

## 🗄️ 4. Supabase PostgreSQL & `pgvector` Schema Setup

Run this SQL script in the **Supabase SQL Editor** to set up vector search:

```sql
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Ensure standard columns exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;

-- HNSW Index for fast vector search
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
  ON public.products 
  USING hnsw (embedding vector_cosine_ops);

-- 3. Create match_products RPC function
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  type TEXT,
  material TEXT,
  price NUMERIC,
  description TEXT,
  image TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.type,
    p.material,
    p.price::numeric,
    p.description,
    p.image,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.is_visible = true
    AND p.embedding IS NOT NULL
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
```

---

## ⚙️ 5. Production Express Backend Route (`Backend/routes/chat.js`)

```javascript
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../database.js";

const router = express.Router();

// Generate vector embedding via Gemini text-embedding-004
async function generateGeminiEmbedding(text, apiKey) {
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
}

// Perform vector search via Supabase RPC
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
    return null;
  }
}

// POST /api/chat/query
router.post("/query", async (req, res) => {
  const { userMessage, query, actionValue, userLabel } = req.body || {};
  const userText = userMessage || query || userLabel || actionValue || "show jewelry";

  let retrievedProducts = await searchSupabaseRpc(userText);

  // Polite High-Volume Busy Error Fallback if DB fails
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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    });
  }

  // Generate Gemini RAG Response
  const geminiJson = await generateGeminiRagResponse(userText, retrievedProducts);

  res.json({
    success: true,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: (geminiJson?.botText || "Here are architectural pieces selected for you:").replace(/!/g, "."),
        products: retrievedProducts,
        options: (geminiJson?.actionChips || []).map((c) => ({ label: c, value: c })),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ],
  });
});

export default router;
```

---

## 🌟 6. The 7 Core Features

| Feature | Icon | Description |
| :--- | :--- | :--- |
| **1. Find a Piece for Myself** | `person_search` | Guided quiz for Category, Occasion, Feel, Budget with personalized reason lines. |
| **2. Find a Gift** | `redeem` | Gift recommendation engine with VRIX+ Circle 10% discount callouts & shipping alerts. |
| **3. Explore Collections** | `grid_view` | Category browser and Bespoke Atelier live price range estimator (`BespokeEstimateCard`). |
| **4. Product Discovery** | `travel_explore` | Smart natural language search with 1-turn iterative refinements ("cheaper", "in silver"). |
| **5. Compare Products** | `compare_arrows` | Up to 3 products side-by-side (desktop table vs. mobile swipeable cards). |
| **6. Diamond Education** | `school` | Plain guidance on 4Cs, 18K solid gold, sterling silver, and conflict-free sourcing. |
| **7. Repairs & Warranty** | `build` | Repair triage and human concierge handoff (`HumanHandoffCard`). |

---

## 🔑 7. Environment Variables (`Backend/.env`)

```env
PORT=5000
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 8. High-Availability & UX Features

1. **Context Memory Window Persistence**: Conversation state and surfaced products are stored in `localStorage` (`vrix-chat-history-v1` and `vrix-chat-engine-state-v1`), preserving chat threads across page reloads.
2. **Polite High-Volume Busy Error Handling**: If database or API connectivity drops, the assistant emits a restrained quiet-luxury busy message instead of crashing.
3. **Bespoke Live Estimate Card**: Provides live estimated price ranges (e.g. ₹65,000 – ₹1,80,000) and crafting lead times (3–4 weeks) with direct atelier consultation booking buttons.

---

## 🛠️ 9. Health & Diagnostics

Test the backend RAG pipeline status at any time:

```bash
curl http://localhost:5000/api/chat/health
```

Expected Output:
```json
{
  "status": "ok",
  "ragEngine": "Supabase RPC match_products + Gemini text-embedding-004 + Gemini 1.5 Flash",
  "supabaseConfigured": true,
  "geminiConfigured": true
}
```

---

## ✨ 10. UI/UX Micro-Interactions & Polish

1. **Hover Copy Message**: Hovering over any assistant message bubble reveals a minimal `content_copy` button that copies the text with a subtle "Copied" confirmation.
2. **Restrained Motion Signature**: Features a single-glint CSS animation on the floating FAB button and send button on hover/idle without distracting flashy loops.
3. **Seamless Mobile Takeover**: Automatically transitions to a full-screen takeover on mobile screens (`<640px`) with body scroll locking to prevent background page scroll drift.
4. **Instant Persistent Memory**: Preserves thread history and surfaced product context in `localStorage` across reloads and tab changes.
