import { ChatMessage, ChatProduct, EntryPoint, EntryPointId, QuickOption, HumanHandoffData } from "./vrix-chat-types";

export const VRIX_ENTRY_POINTS: EntryPoint[] = [
  {
    id: "myself",
    label: "Find a Piece for Myself",
    icon: "person_search",
    description: "Curated jewelry tailored to your personal aesthetic and budget.",
  },
  {
    id: "gift",
    label: "Find a Gift",
    icon: "redeem",
    description: "Thoughtful recommendations for someone special with gift perks.",
  },
  {
    id: "collections",
    label: "Explore Collections",
    icon: "grid_view",
    description: "Browse VRIX categories, signature edits, and bespoke design.",
  },
  {
    id: "discovery",
    label: "Product Discovery",
    icon: "travel_explore",
    description: "Natural language search by metal, price, and minimalist style.",
  },
  {
    id: "compare",
    label: "Compare Products",
    icon: "compare_arrows",
    description: "Side-by-side breakdown of materials, stones, and specifications.",
  },
  {
    id: "education",
    label: "Diamond Education",
    icon: "school",
    description: "Learn about the 4Cs, conflict-free stones, and ethical metals.",
  },
  {
    id: "warranty",
    label: "Repairs & Warranty",
    icon: "build",
    description: "Care guidance, resizes, and concierge repair assistance.",
  },
];

export const VRIX_CATALOG: ChatProduct[] = [];

export interface EngineState {
  currentFlow: EntryPointId | null;
  step: number;
  data: Record<string, any>;
  surfacedProducts: ChatProduct[];
}

export function createInitialMessage(): ChatMessage {
  return {
    id: "msg-welcome",
    sender: "bot",
    text: "Welcome to VRIX. Tell me who this is for and the occasion, and I'll narrow it down.",
    timestamp: formatTime(new Date()),
  };
}

export function handleUserAction(
  actionValue: string,
  userLabel: string | undefined,
  state: EngineState
): { nextState: EngineState; messages: ChatMessage[] } {
  const nextData = { ...state.data };
  let nextFlow = state.currentFlow;
  let nextStep = state.step;
  let surfaced = [...state.surfacedProducts];
  const messages: ChatMessage[] = [];

  const time = formatTime(new Date());

  // Check if starting a new flow via entry point trigger
  const entryMatch = VRIX_ENTRY_POINTS.find((e) => e.id === actionValue || e.label === userLabel);
  if (entryMatch) {
    nextFlow = entryMatch.id;
    nextStep = 1;
    delete nextData[entryMatch.id];
  }

  if (nextFlow === "myself") {
    if (nextStep === 1) {
      nextStep = 2;
      messages.push({
        id: `msg-${Date.now()}-1`,
        sender: "bot",
        text: "What are you shopping for?",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Not sure yet", value: "All" },
        ],
        timestamp: time,
      });
    } else if (nextStep === 2) {
      nextData.category = actionValue;
      nextStep = 3;
      messages.push({
        id: `msg-${Date.now()}-2`,
        sender: "bot",
        text: "What is the occasion?",
        options: [
          { label: "Everyday wear", value: "Everyday" },
          { label: "Work & professional", value: "Work" },
          { label: "Evening or event", value: "Evening" },
          { label: "Just because", value: "Just because" },
          { label: "Skip step", value: "skip" },
        ],
        timestamp: time,
      });
    } else if (nextStep === 3) {
      nextData.occasion = actionValue;
      nextStep = 4;
      messages.push({
        id: `msg-${Date.now()}-3`,
        sender: "bot",
        text: "Which aesthetic feels most like you?",
        options: [
          { label: "Minimal & quiet", value: "Minimal" },
          { label: "A little bolder", value: "Bold" },
          { label: "Statement piece", value: "Statement" },
          { label: "Skip step", value: "skip" },
        ],
        timestamp: time,
      });
    } else if (nextStep === 4) {
      nextData.feel = actionValue;
      nextStep = 5;
      messages.push({
        id: `msg-${Date.now()}-4`,
        sender: "bot",
        text: "Select a budget preference:",
        options: [
          { label: "Under ₹15,000", value: "15000" },
          { label: "₹15,000 – ₹40,000", value: "40000" },
          { label: "₹40,000 – ₹75,000", value: "75000" },
          { label: "₹75,000+", value: "100000" },
          { label: "Skip step", value: "skip" },
        ],
        timestamp: time,
      });
    } else {
      nextData.budget = actionValue;
      const filtered = filterCatalog(nextData.category, nextData.budget);
      surfaced = Array.from(new Set([...surfaced, ...filtered]));
      nextFlow = null;
      nextStep = 0;

      messages.push({
        id: `msg-${Date.now()}-res`,
        sender: "bot",
        text: `Here are pieces selected for you based on your aesthetic preference:`,
        products: filtered,
        options: [
          { label: "Compare a couple of these", value: "trigger-compare" },
          { label: "Explore all collections", value: "collections" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "gift") {
    if (nextStep === 1) {
      nextStep = 2;
      messages.push({
        id: `msg-${Date.now()}-g1`,
        sender: "bot",
        text: "Who are you shopping for?",
        options: [
          { label: "Partner", value: "Partner" },
          { label: "Parent", value: "Parent" },
          { label: "Friend", value: "Friend" },
          { label: "Colleague", value: "Colleague" },
          { label: "Myself", value: "myself" },
        ],
        timestamp: time,
      });
    } else if (nextStep === 2) {
      if (actionValue === "myself") {
        nextFlow = "myself";
        nextStep = 2;
        messages.push({
          id: `msg-${Date.now()}-g-hand`,
          sender: "bot",
          text: "What are you shopping for?",
          options: [
            { label: "Necklaces", value: "Necklaces" },
            { label: "Earrings", value: "Earrings" },
            { label: "Rings", value: "Rings" },
            { label: "Bracelets", value: "Bracelets" },
          ],
          timestamp: time,
        });
      } else {
        nextData.recipient = actionValue;
        nextStep = 3;
        messages.push({
          id: `msg-${Date.now()}-g2`,
          sender: "bot",
          text: "What is the occasion?",
          options: [
            { label: "Birthday", value: "Birthday" },
            { label: "Anniversary", value: "Anniversary" },
            { label: "Wedding", value: "Wedding" },
            { label: "Festival", value: "Festival" },
            { label: "No occasion, just because", value: "Just because" },
          ],
          timestamp: time,
        });
      }
    } else if (nextStep === 3) {
      nextData.occasion = actionValue;
      nextStep = 4;
      messages.push({
        id: `msg-${Date.now()}-g3`,
        sender: "bot",
        text: "Select a gift budget range:",
        options: [
          { label: "Under ₹15,000", value: "15000" },
          { label: "₹15,000 – ₹40,000", value: "40000" },
          { label: "₹40,000+", value: "75000" },
        ],
        timestamp: time,
      });
    } else {
      nextData.budget = actionValue;
      const picks = VRIX_CATALOG.slice(0, 3);
      surfaced = Array.from(new Set([...surfaced, ...picks]));
      nextFlow = null;
      nextStep = 0;

      const isUpcomingClose = nextData.occasion === "Anniversary" || nextData.occasion === "Birthday";

      messages.push({
        id: `msg-${Date.now()}-gift-out`,
        sender: "bot",
        text: `Here are gift-appropriate picks for your ${nextData.recipient || "special recipient"}.${
          isUpcomingClose
            ? " Standard insured shipping takes 2-4 business days. Check our shipping schedule anytime at /legal?tab=shipping."
            : ""
        }\n\nVRIX+ Circle members receive 10% off their first order and early sale access.`,
        products: picks,
        options: [
          { label: "Explore full gift guide", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "collections") {
    if (nextStep === 1) {
      if (["Necklaces", "Earrings", "Rings", "Bracelets"].includes(actionValue)) {
        const filtered = VRIX_CATALOG.filter((p) => p.category === actionValue);
        surfaced = Array.from(new Set([...surfaced, ...filtered]));
        messages.push({
          id: `msg-${Date.now()}-col-cat`,
          sender: "bot",
          text: `${actionValue} — architectural forms crafted from ethical metals and conflict-free stones.`,
          products: filtered,
          options: [
            { label: "Compare these pieces", value: "trigger-compare" },
            { label: "Back to collections menu", value: "collections" },
          ],
          timestamp: time,
        });
        nextFlow = null;
        nextStep = 0;
      } else if (actionValue === "Bespoke") {
        nextStep = 2;
        messages.push({
          id: `msg-${Date.now()}-bespoke-1`,
          sender: "bot",
          text: "Bespoke pieces are made-to-order in our atelier. What silhouette or stone do you have in mind?",
          options: [
            { label: "Solitaire diamond ring", value: "Ring design" },
            { label: "Sculptural pendant", value: "Pendant design" },
            { label: "Custom wedding band pair", value: "Wedding bands" },
          ],
          timestamp: time,
        });
      } else {
        nextStep = 1;
        messages.push({
          id: `msg-${Date.now()}-col-menu`,
          sender: "bot",
          text: "Select a collection category to explore:",
          options: [
            { label: "Necklaces", value: "Necklaces" },
            { label: "Earrings", value: "Earrings" },
            { label: "Rings", value: "Rings" },
            { label: "Bracelets", value: "Bracelets" },
            { label: "Bespoke", value: "Bespoke" },
            { label: "New Arrivals", value: "Earrings" },
          ],
          timestamp: time,
        });
      }
    } else if (nextStep === 2) {
      nextFlow = null;
      nextStep = 0;
      messages.push({
        id: `msg-${Date.now()}-bespoke-out`,
        sender: "bot",
        text: "Our master goldsmiths work directly with you from preliminary sketch to final setting.",
        bespokeEstimate: {
          pieceType: userLabel || actionValue || "Custom Fine Jewelry",
          metalChoice: "18K Solid Gold / 950 Platinum",
          estimatedPriceRange: "₹65,000 – ₹1,80,000",
          leadTime: "3 – 4 Weeks",
        },
        options: [
          { label: "Book Atelier Consultation", value: "trigger-handoff" },
          { label: "Browse standard collections", value: "collections" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "discovery") {
    nextFlow = null;
    nextStep = 0;
    const parsed = parseUserQuery(userLabel || actionValue);
    const results = filterCatalog(parsed.category, parsed.budgetStr);
    surfaced = Array.from(new Set([...surfaced, ...results]));

    messages.push({
      id: `msg-${Date.now()}-disc-res`,
      sender: "bot",
      text: results.length
        ? `Found ${results.length} matching pieces:`
        : "Here are signature pieces matching your style preference:",
      products: results.length ? results : VRIX_CATALOG.slice(0, 3),
      options: [
        { label: "Compare these pieces", value: "trigger-compare" },
        { label: "Show cheaper options", value: "under-15000" },
        { label: "Show in silver", value: "silver" },
      ],
      timestamp: time,
    });
  } else if (nextFlow === "compare" || actionValue === "trigger-compare") {
    nextFlow = null;
    nextStep = 0;
    const compareList = surfaced.length >= 2 ? surfaced.slice(0, 3) : [];
    if (compareList.length >= 2) {
      messages.push({
        id: `msg-${Date.now()}-comp`,
        sender: "bot",
        text: "Side-by-side comparison of your selected pieces:",
        comparison: { products: compareList },
        options: [
          { label: "Find another piece", value: "myself" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    } else {
      messages.push({
        id: `msg-${Date.now()}-comp-empty`,
        sender: "bot",
        text: "Which pieces would you like to compare? Please search for or select 2 to 3 items to compare side-by-side.",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Explore collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "education") {
    if (actionValue === "4Cs") {
      messages.push({
        id: `msg-${Date.now()}-4cs`,
        sender: "bot",
        text: "The 4Cs define diamond quality: Cut determines brilliance; Color ranges from colorless to warm tint; Clarity measures natural internal characteristics; Carat indicates weight. VRIX selects only excellent cut grades for maximum light reflection.",
        options: [
          { label: "VRIX ethical sourcing", value: "Sourcing" },
          { label: "Metal purity guide", value: "Metals" },
          { label: "Show diamond pieces", value: "myself" },
        ],
        timestamp: time,
      });
    } else if (actionValue === "Sourcing") {
      messages.push({
        id: `msg-${Date.now()}-src`,
        sender: "bot",
        text: "VRIX uses consciously mined metals and conflict-free stones. Every diamond is verified through ethical supply chains, and our solid gold and sterling silver are 100% recycled where possible.",
        options: [
          { label: "Metal purity guide", value: "Metals" },
          { label: "Explore collections", value: "collections" },
        ],
        timestamp: time,
      });
    } else if (actionValue === "Metals") {
      messages.push({
        id: `msg-${Date.now()}-met`,
        sender: "bot",
        text: "We craft in 18K solid yellow gold, 18K white gold, 950 platinum, and 925 sterling silver. 18K gold offers the ideal balance of deep lustre and durability for fine jewelry.",
        options: [
          { label: "Diamond 4Cs", value: "4Cs" },
          { label: "Explore collections", value: "collections" },
        ],
        timestamp: time,
      });
    } else {
      messages.push({
        id: `msg-${Date.now()}-edu-menu`,
        sender: "bot",
        text: "What would you like to know about our materials?",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Ethical Sourcing", value: "Sourcing" },
          { label: "Metal Purity Guide", value: "Metals" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "warranty") {
    if (actionValue === "Care") {
      messages.push({
        id: `msg-${Date.now()}-care`,
        sender: "bot",
        text: "Store each piece separately in its soft linen VRIX box. Avoid contact with perfumes, chemicals, and saltwater. Clean gently with a soft microfibre cloth.",
        options: [
          { label: "Warranty & Repair claim", value: "Repair" },
          { label: "Read care guide at /legal", value: "legal" },
        ],
        timestamp: time,
      });
    } else {
      messages.push({
        id: `msg-${Date.now()}-hand-trig`,
        sender: "bot",
        text: "Our concierge team handles all resizes, physical inspections, and warranty claims with individual care.",
        handoff: getHandoffData(),
        timestamp: time,
      });
    }
  } else if (actionValue === "trigger-handoff") {
    messages.push({
      id: `msg-${Date.now()}-hand-direct`,
      sender: "bot",
      text: "Reach out directly to our quiet luxury retail associate team:",
      handoff: getHandoffData(),
      timestamp: time,
    });
  } else {
    // Free text fallback or unknown option
    const textInput = (userLabel || actionValue || "").trim();
    const qLower = textInput.toLowerCase();
    const isGeneralBrandQuery =
      qLower.includes("what") ||
      qLower.includes("make") ||
      qLower.includes("craft") ||
      qLower.includes("about") ||
      qLower.includes("who") ||
      qLower.includes("collection") ||
      qLower.includes("vrix");

    const parsed = parseUserQuery(textInput);
    const results = (parsed.category || parsed.budgetStr) ? filterCatalog(parsed.category, parsed.budgetStr) : [];

    if (results.length > 0) {
      messages.push({
        id: `msg-${Date.now()}-fb`,
        sender: "bot",
        text: `Here are architectural pieces matching your request:`,
        products: results,
        options: [
          { label: "Compare these pieces", value: "trigger-compare" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    } else if (isGeneralBrandQuery) {
      messages.push({
        id: `msg-${Date.now()}-brand-info`,
        sender: "bot",
        text: "VRIX crafts architectural minimalist fine jewelry using consciously mined metals and conflict-free stones. Our collections include Necklaces, Earrings, Rings, Bracelets, and made-to-order Bespoke creations.",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Explore collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    } else {
      messages.push({
        id: `msg-${Date.now()}-fb-def`,
        sender: "bot",
        text: "I apologize, but I do not have that specific information in our current catalog. Please connect with our concierge for bespoke requests.",
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Find a gift", value: "gift" },
          { label: "Explore collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    }
  }

  return {
    nextState: {
      currentFlow: nextFlow,
      step: nextStep,
      data: nextData,
      surfacedProducts: surfaced,
    },
    messages,
  };
}

function filterCatalog(category?: string, budgetStr?: string): ChatProduct[] {
  let list = VRIX_CATALOG;
  if (category && category !== "All") {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  if (budgetStr) {
    const budgetVal = parseInt(budgetStr);
    if (!isNaN(budgetVal) && budgetVal > 0) {
      list = list.filter((p) => p.price <= budgetVal);
    }
  }
  return list;
}

function parseUserQuery(query: string): { category?: string; budgetStr?: string } {
  const q = query.toLowerCase();
  let category: string | undefined;
  if (q.includes("ring")) category = "Rings";
  else if (q.includes("necklace") || q.includes("pendant")) category = "Necklaces";
  else if (q.includes("earring")) category = "Earrings";
  else if (q.includes("bracelet") || q.includes("cuff")) category = "Bracelets";

  let budgetStr: string | undefined;
  if (q.includes("15k") || q.includes("15000") || q.includes("under 15")) budgetStr = "15000";
  else if (q.includes("40k") || q.includes("40000")) budgetStr = "40000";
  else if (q.includes("75k") || q.includes("75000")) budgetStr = "75000";

  return { category, budgetStr };
}

export function getHandoffData(): HumanHandoffData {
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

function formatTime(d: Date): string {
  return d.toISOString();
}
