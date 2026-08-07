# VRIX Luxury Chat Assistant & Gemini RAG Documentation

Welcome to the comprehensive technical documentation for the **VRIX Floating Luxury Chat Widget** and its **Gemini AI + Vector RAG Backend Engine**.

---

## 📌 Executive Summary & Brand Identity

The VRIX Chat Assistant is designed as a native digital extensions of a quiet-luxury retail associate. It rejects generic, hyper-enthusiastic AI chatbot conventions in favor of a warm, restrained, and confident tone.

- **Brand Tagline**: *"Designed for the moments that belong only to you."*
- **Voice Guidelines**: Plain verbs, sentence case, zero exclamation points, zero fluff.
- **Visual Design**: Strict adherence to VRIX design tokens (Tailwind CSS v4 `@theme`), custom font pairing (`Inter` + `Jost`), Material Symbols Outlined iconography (weight 200), and a signature **restrained glint motion** effect on key interactive elements.

---

## 🏗️ System Architecture & Workflow

The chatbot employs a **Retrieval-Augmented Generation (RAG)** architecture combining vector similarity search over PostgreSQL product data with Google's Gemini AI model.

```
┌──────────────────────────┐          ┌──────────────────────────┐
│  VRIX Frontend (Next.js) │          │   VRIX Backend (Node.js) │
│  - VrixChatWidget        │          │   - /api/chat/query      │
│  - Tailwind v4 Tokens    │          │   - Vector Similarity    │
└────────────┬─────────────┘          └────────────┬─────────────┘
             │                                     │
             │ 1. POST /api/chat/query             │ 2. Vector Cosine Search
             ├────────────────────────────────────>│    (Title, Material, Type,
             │                                     │     Price, Description)
             │                                     │
             │                                     │ 3. Build RAG Context
             │                                     │    + VRIX System Prompt
             │                                     │
             │                                     │ 4. Call Gemini AI API
             │                                     │    (gemini-1.5-flash)
             │                                     │
             │ 5. Structured JSON Response         │
             │    (Text + Product Cards + Chips)   │
             │<────────────────────────────────────┤
             v                                     v
```

### Gemini System Prompt & Output Schema (Strict JSON)

The backend passes the following system directives to Gemini AI:

```json
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
```

- **Voice & Tone Directives**: Warm, restrained, confident, plain verbs, sentence case, zero fluff.
- **Strict Constraint**: Zero exclamation marks (`!`). All responses are cleaned to eliminate exclamation marks.

---

## 🗄️ Supabase PostgreSQL & `pgvector` Schema Setup

Run the following SQL migration script inside the **Supabase SQL Editor** to enable `vector` search and create the `match_products` RPC function:

```sql
-- 1. Enable the pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to existing products table (or create table if new)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Ensure standard columns exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;

-- HNSW Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
  ON public.products 
  USING hnsw (embedding vector_cosine_ops);

-- 3. Create RPC matching function (match_products) for cosine similarity search
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

## 🌟 The 7 Core Features & Entry Points

| Feature | Icon | Function & Interactive Output |
| :--- | :--- | :--- |
| **1. Find a Piece for Myself** | `person_search` | Single-select guided quiz (Category, Occasion, Feel, Budget) outputting 3–4 product cards with tailored *"why this fits"* reasoning. |
| **2. Find a Gift** | `redeem` | Recipient & occasion triage; surfaces VRIX+ Circle 10% first-order discount callouts and shipping timeline notices. |
| **3. Explore Collections** | `grid_view` | Interactive chip grid for Necklaces, Earrings, Rings, Bracelets, New Arrivals, and Bespoke consultation routing. |
| **4. Product Discovery** | `travel_explore` | Smart natural language query parser for category, budget floor/ceiling, metal, and style keywords with 1-turn iterative refinements ("cheaper", "in silver"). |
| **5. Compare Products** | `compare_arrows` | Up to 3 products side-by-side (desktop 3-column feature matrix vs. mobile swipeable stacked cards view). |
| **6. Diamond Education** | `school` | Plain factual guidance on 4Cs, VRIX conflict-free ethical sourcing ("consciously mined metals and conflict-free stones"), and metal purities (18K solid gold, 925 sterling silver). |
| **7. Repairs & Warranty** | `build` | Triage flow for resizes, damage claims, and general care advice; hands off seamlessly to human concierge. |

---

## 🔑 How to Configure & Add API Keys

### Step 1: Obtain a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy your generated API key string.

### Step 2: Configure Environment Variables
Open `Backend/.env` (or create it if missing) and add your API key:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

*(Note: The system also checks `GOOGLE_API_KEY` as a fallback).*

### Step 3: API Key Fallback Mechanism
If no `GEMINI_API_KEY` is provided in environment variables:
- The chatbot automatically switches to its built-in **Local Rule-Based RAG Engine**.
- Vector database retrieval and interactive product card recommendations continue functioning seamlessly without crashing.

---

## 💎 Benefits & Value Proposition

1. **Native Brand Integration**: Uses registered `@theme` tokens (`bg-primary`, `text-on-primary`, `bg-surface-container-low`, `bg-secondary-container`) so it feels like a native part of the website rather than a bolted-on widget.
2. **Elevated Customer Conversion**: Tailored "why this fits" reason lines connect customer preferences directly to product attributes.
3. **Multi-Currency Support**: Prices dynamically adapt to the user's active shop currency selection (`formatPrice` in INR, USD, EUR, etc.).
4. **Mobile First & Accessible**: Responsive modal behavior (<640px full-screen takeover with body scroll lock vs desktop floating card) with full keyboard accessibility (Esc to close, Enter to send).
5. **Reduced Support Friction**: Handles routine care, material purity, warranty triage, and diamond education automatically.

---

## 🚀 High-Availability Solutions & Architectural Enhancements

1. **Direct Database RAG Search**: Vector search queries the live PostgreSQL database (`db.products`) directly for zero-stale real-time product matching.
2. **Context Memory Window Persistence**: Active chat threads, messages, and recommendation states are persisted in `localStorage` (`vrix-chat-history-v1` and `vrix-chat-engine-state-v1`). Refreshing the browser or navigating between shop pages preserves the exact conversation state.
3. **Interactive Bespoke Atelier Estimator**: Users exploring Bespoke jewelry receive instant live price range estimates (e.g. ₹65,000 – ₹1,80,000 in INR) and atelier crafting lead times (3–4 weeks) alongside direct consultation booking links.
4. **Polite High-Volume Busy Fallback**: If a database error or connection issue occurs, the assistant outputs a restrained quiet-luxury busy message (*"Our client associates are currently experiencing high volume assisting other guests. Please try again in a few moments, or connect directly with our concierge team."*) with options to retry or contact concierge directly.

---

## 🛠️ Verification & Health Check

To verify the backend RAG and Gemini AI status at any time, query the health endpoint:

```bash
curl http://localhost:5000/api/chat/health
```

Expected Response:
```json
{
  "status": "ok",
  "ragEngine": "pgvector + Gemini AI",
  "geminiConfigured": true
}
```
