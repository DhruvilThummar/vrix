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

### Flow Execution Steps:
1. **User Action**: The user selects a quick action chip or types a natural language query in the chat input.
2. **Vector Similarity Retrieval**: The backend tokenizes the user prompt and computes a term-vector cosine similarity score against all visible products in the database (`db.products`).
3. **RAG Context Synthesis**: The top matching product records (including material, category, price, and reason lines) are compiled into a structured context window.
4. **Gemini AI Generation**: The backend passes the quiet-luxury system prompt, catalog context, and user prompt to Gemini API (`gemini-1.5-flash`).
5. **Structured Response**: The backend returns a unified payload with bot text, interactive product cards, quick-reply option chips, comparison views, or human handoff details.

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

## ⚠️ Current Limitations & Drawbacks

1. **Database Dependency**: Vector search relies on database connectivity; if DB is offline, local fallback product catalog items are served.
2. **Context Memory Window**: The session memory tracks products surfaced in the current browser session; refreshing the page resets thread state.
3. **Custom Bespoke Orders**: Bespoke jewelry cannot be instantly price-quoted or generated online; it gracefully routes to a human concierge consultation.

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
