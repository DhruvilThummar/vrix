import {
  ChatMessage,
  ChatProduct,
  EntryPoint,
  EntryPointId,
  QuickOption,
  HumanHandoffData,
  SocialLinksData,
  EmailCollectorData,
  SaleDiscountCardData,
} from "./vrix-chat-types";

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

export const VRIX_LAUNCH_ENTRY_POINTS: EntryPoint[] = [
  {
    id: "launch_date",
    label: "Launch Countdown & Date",
    icon: "schedule",
    description: "Check the official unveiling date and live countdown.",
  },
  {
    id: "launch_waitlist",
    label: "Join VIP Waitlist",
    icon: "mail",
    description: "Enter email for exclusive early private atelier access.",
  },
  {
    id: "social_channels",
    label: "Instagram & Facebook",
    icon: "public",
    description: "Connect on Instagram and Facebook for atelier releases.",
  },
  {
    id: "education",
    label: "About VRIX Lab Diamonds",
    icon: "diamond",
    description: "Learn about our conflict-free lab diamonds and 18K metals.",
  },
];

export const VRIX_SALE_ENTRY_POINTS: EntryPoint[] = [
  {
    id: "sale_details",
    label: "Sale Offer & Promo Code",
    icon: "local_offer",
    description: "View active discount percentage, promo code, and validity.",
  },
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
    label: "Browse Collections",
    icon: "grid_view",
    description: "Browse VRIX categories, signature edits, and bespoke design.",
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
];

export function getEntryPointsForMode(mode?: string): EntryPoint[] {
  if (mode === "LAUNCH") return VRIX_LAUNCH_ENTRY_POINTS;
  if (mode === "SALE") return VRIX_SALE_ENTRY_POINTS;
  return VRIX_ENTRY_POINTS;
}

// Initial fallback catalog of authentic signature pieces so chat is never empty
export let VRIX_CATALOG: ChatProduct[] = [
  {
    id: "solitaire-arc-ring",
    title: "The Solitaire Arc Ring",
    category: "Rings",
    material: "18K Gold Vermeil",
    price: 18500,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800"
    ],
    whyFits: "Architectural minimal band set with brilliant round lab solitaire.",
    stone: "1.0 ct VS+ Lab Diamond",
    warranty: "Lifetime Craftsmanship Guarantee",
    slug: "solitaire-arc-ring"
  },
  {
    id: "pave-aura-necklace",
    title: "Pavé Aura Solitaire Necklace",
    category: "Necklaces",
    material: "18K Gold Vermeil",
    price: 24000,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800"
    ],
    whyFits: "Floating laboratory diamond pendant on delicate 18-inch cable chain.",
    stone: "0.75 ct VS+ Lab Diamond",
    warranty: "Lifetime Craftsmanship Guarantee",
    slug: "pave-aura-necklace"
  },
  {
    id: "geometric-prism-earrings",
    title: "Geometric Prism Stud Earrings",
    category: "Earrings",
    material: "925 Sterling Silver",
    price: 12500,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800"
    ],
    whyFits: "Subtle architectural silhouette engineered for effortless daily wear.",
    stone: "Lab Diamond (VS+)",
    warranty: "Lifetime Craftsmanship Guarantee",
    slug: "geometric-prism-earrings"
  },
  {
    id: "linear-solitaire-cuff",
    title: "Linear Solitaire Bangle",
    category: "Bracelets",
    material: "18K Gold Vermeil",
    price: 32000,
    image: "https://images.unsplash.com/photo-1611591475878-a28d575443fa?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1611591475878-a28d575443fa?auto=format&fit=crop&q=80&w=800"
    ],
    whyFits: "Hinged precision cuff featuring twin bezel-set lab solitaires.",
    stone: "Twin Lab Solitaires (VS+)",
    warranty: "Lifetime Craftsmanship Guarantee",
    slug: "linear-solitaire-cuff"
  }
];

export function setChatCatalog(products: ChatProduct[]) {
  if (Array.isArray(products) && products.length > 0) {
    VRIX_CATALOG = products;
  }
}

export interface EngineState {
  currentFlow: EntryPointId | string | null;
  step: number;
  data: Record<string, any>;
  surfacedProducts: ChatProduct[];
}

export function createInitialMessage(
  mode: string = "DISABLED",
  launchConfig?: any,
  timeLeft?: any
): ChatMessage {
  const time = formatTime(new Date());

  // 1. LAUNCH MODE
  if (mode === "LAUNCH") {
    let countdownText = "";
    if (timeLeft && !timeLeft.isExpired) {
      countdownText = ` — unveiling in ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    }

    const targetDateFormatted = launchConfig?.targetDate
      ? new Date(launchConfig.targetDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Coming Soon";

    return {
      id: "msg-welcome-launch",
      sender: "bot",
      text: `Welcome to VRIX. Our digital atelier arrives on ${targetDateFormatted}${countdownText}.\n\nEnter your email for private VIP early access, or connect with our atelier on Instagram and Facebook for preview reveals:`,
      emailCollector: {
        placeholder: "your.email@example.com",
        buttonText: "Notify Me",
        successMessage: launchConfig?.waitlistSuccessMsg || "Thank you. You have been added to our private VIP launch waitlist.",
      },
      socialLinks: {
        title: "Follow VRIX Atelier",
        description: "Official releases, atelier previews, and launch news.",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280",
        whatsapp: "https://wa.me/919054285693?text=Hi%20VRIX%20Concierge,%20I%20have%20an%20inquiry%20regarding%20the%20upcoming%20launch.",
      },
      options: [
        { label: "When is the Launch?", value: "launch_date" },
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "Instagram & Facebook", value: "social_channels" },
        { label: "About VRIX Lab Diamonds", value: "education" },
      ],
      timestamp: time,
    };
  }

  // 2. SALE MODE
  if (mode === "SALE") {
    const highlight = launchConfig?.saleDiscountHighlight || "Special Atelier Pricing";
    const adminCode = typeof launchConfig?.saleDiscountCode === "string" ? launchConfig.saleDiscountCode.trim() : "";
    const title = launchConfig?.saleTitle || "THE PRIVATE ARCHIVE EVENT";

    let validity = "Limited Time Atelier Event";
    if (timeLeft && !timeLeft.isExpired) {
      validity = `Ends in ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    }

    const promoNotice = adminCode
      ? ` Enjoy ${highlight} with official promo code [${adminCode}].`
      : ` Enjoy ${highlight} with direct pricing (no code required).`;

    return {
      id: "msg-welcome-sale",
      sender: "bot",
      text: `Welcome to VRIX. ${title} is currently live across our collections.${promoNotice}\n\nHow may I assist your exploration today?`,
      saleDiscountCard: adminCode
        ? {
            highlight,
            code: adminCode,
            description: launchConfig?.saleDescription || "Enjoy exclusive atelier pricing across selected solitaires, minimal rings, and pavé bands.",
            validUntil: validity,
            ctaUrl: launchConfig?.saleCtaUrl || "/collections",
          }
        : undefined,
      options: [
        ...(adminCode ? [{ label: `Copy Code [${adminCode}]`, value: "sale_details" }] : []),
        { label: "Find a piece for myself", value: "myself" },
        { label: "Find a gift", value: "gift" },
        { label: "Explore collections", value: "collections" },
      ],
      timestamp: time,
    };
  }

  // 3. STORE / DISABLED MODE
  return {
    id: "msg-welcome-store",
    sender: "bot",
    text: "Welcome to VRIX. Tell me who this is for and the occasion, and I'll narrow it down.",
    options: [
      { label: "Find a piece for myself", value: "myself" },
      { label: "Find a gift", value: "gift" },
      { label: "Explore collections", value: "collections" },
      { label: "Diamond Education", value: "education" },
    ],
    timestamp: time,
  };
}

export function handleUserAction(
  actionValue: string,
  userLabel: string | undefined,
  state: EngineState,
  launchConfig?: any,
  timeLeft?: any
): { nextState: EngineState; messages: ChatMessage[] } {
  const nextData = { ...state.data };
  let nextFlow = state.currentFlow;
  let nextStep = state.step;
  let surfaced = [...state.surfacedProducts];
  const messages: ChatMessage[] = [];

  const time = formatTime(new Date());
  const activeMode = launchConfig?.mode || "DISABLED";

  // Check if starting a new flow via entry point trigger
  const allPossibleEntryPoints = [
    ...VRIX_ENTRY_POINTS,
    ...VRIX_LAUNCH_ENTRY_POINTS,
    ...VRIX_SALE_ENTRY_POINTS,
  ];
  const entryMatch = allPossibleEntryPoints.find(
    (e) => e.id === actionValue || e.label === userLabel
  );

  if (entryMatch) {
    nextFlow = entryMatch.id;
    nextStep = 1;
    delete nextData[entryMatch.id];
  }

  // ── LAUNCH SPECIFIC ACTIONS ────────────────────────────────────────────────
  if (actionValue === "launch_date" || userLabel === "When is the Launch?" || actionValue.includes("launch_date")) {
    const targetDateFormatted = launchConfig?.targetDate
      ? new Date(launchConfig.targetDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Coming Soon";

    let countdownMsg = "";
    if (timeLeft && !timeLeft.isExpired) {
      countdownMsg = `\n\nLive Countdown: ${timeLeft.days} Days, ${timeLeft.hours} Hours, ${timeLeft.minutes} Minutes remaining until public unlock.`;
    }

    messages.push({
      id: `msg-${Date.now()}-launch-date`,
      sender: "bot",
      text: `Official VRIX Digital Atelier Launch:\n• Date: ${targetDateFormatted}${countdownMsg}\n\nOur inaugural collection features VS+ architectural lab-grown diamond solitaires crafted in solid 18K gold and 925 sterling silver. Join our VIP waitlist below for 24-hour early access:`,
      emailCollector: {
        placeholder: "Enter your email for early invite...",
        buttonText: "Join VIP Waitlist",
      },
      socialLinks: {
        title: "Follow Along for Live Launch Countdown",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280",
      },
      options: [
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "Instagram & Facebook", value: "social_channels" },
        { label: "About VRIX Lab Diamonds", value: "education" },
      ],
      timestamp: time,
    });
    return { nextState: { currentFlow: null, step: 0, data: nextData, surfacedProducts: surfaced }, messages };
  }

  if (actionValue === "launch_waitlist" || userLabel === "Join VIP Waitlist" || actionValue.includes("waitlist")) {
    messages.push({
      id: `msg-${Date.now()}-waitlist`,
      sender: "bot",
      text: "VIP Early Access Allocation:\nMembers on our waitlist receive private digital access before the official public unveiling, alongside exclusive first-drop invitations.",
      emailCollector: {
        placeholder: "Enter your email address...",
        buttonText: "Notify Me",
      },
      options: [
        { label: "When is the Launch?", value: "launch_date" },
        { label: "Instagram & Facebook", value: "social_channels" },
        { label: "About VRIX Lab Diamonds", value: "education" },
      ],
      timestamp: time,
    });
    return { nextState: { currentFlow: null, step: 0, data: nextData, surfacedProducts: surfaced }, messages };
  }

  if (actionValue === "social_channels" || userLabel === "Instagram & Facebook" || actionValue.includes("social")) {
    messages.push({
      id: `msg-${Date.now()}-social`,
      sender: "bot",
      text: "Stay connected with VRIX across our official digital ateliers. We publish daily diamond education, behind-the-scenes goldsmith craftsmanship, and unveiling countdowns on Instagram and Facebook:",
      socialLinks: {
        title: "VRIX Official Channels",
        description: "Follow @vrix.official for inaugural solitaire previews & launch stories.",
        instagram: "https://www.instagram.com/vrix.official",
        facebook: "https://www.facebook.com/profile.php?id=61588375466280",
        whatsapp: "https://wa.me/919054285693?text=Hi%20VRIX%20Concierge,%20I%20would%20like%20to%20learn%20more%20about%20your%20upcoming%20launch.",
      },
      options: [
        { label: "When is the Launch?", value: "launch_date" },
        { label: "Join VIP Waitlist", value: "launch_waitlist" },
        { label: "About VRIX Lab Diamonds", value: "education" },
      ],
      timestamp: time,
    });
    return { nextState: { currentFlow: null, step: 0, data: nextData, surfacedProducts: surfaced }, messages };
  }

  // ── STRICT LAUNCH MODE INTERCEPTOR: NEVER ALLOW SHOPPING OR PRODUCTS ───────────
  if (activeMode === "LAUNCH") {
    const isEducation =
      actionValue === "education" ||
      userLabel === "About VRIX Lab Diamonds" ||
      actionValue === "4Cs" ||
      actionValue === "Sourcing" ||
      actionValue === "Metals";

    if (!isEducation) {
      messages.push({
        id: `msg-${Date.now()}-launch-waitlist-call`,
        sender: "bot",
        text: "The VRIX digital atelier arrives soon. Our inaugural fine jewellery collections are currently being prepared for unveiling. Direct shopping and product browsing are reserved until official launch day.\n\nEnter your email to receive private VIP early access before the public unveiling, or connect with our atelier on Instagram and Facebook for preview reveals:",
        emailCollector: {
          placeholder: "Enter your email for early invite...",
          buttonText: "Join VIP Waitlist",
        },
        socialLinks: {
          title: "Follow Along on Official Channels",
          description: "Official previews, craftsmanship reels, and launch countdown announcements.",
          instagram: "https://www.instagram.com/vrix.official",
          facebook: "https://www.facebook.com/profile.php?id=61588375466280",
          whatsapp: "https://wa.me/919054285693?text=Hi%20VRIX%20Concierge,%20I%20have%20an%20inquiry%20regarding%20the%20upcoming%20launch.",
        },
        options: [
          { label: "When is the Launch?", value: "launch_date" },
          { label: "Join VIP Waitlist", value: "launch_waitlist" },
          { label: "Instagram & Facebook", value: "social_channels" },
          { label: "About VRIX Lab Diamonds", value: "education" },
        ],
        timestamp: time,
      });
      return {
        nextState: { currentFlow: null, step: 0, data: nextData, surfacedProducts: [] },
        messages,
      };
    }
  }

  // ── SALE SPECIFIC ACTIONS ──────────────────────────────────────────────────
  if (actionValue === "sale_details" || userLabel?.includes("Sale") || userLabel?.includes("Promo Code") || userLabel?.includes("Offer")) {
    const adminCode = typeof launchConfig?.saleDiscountCode === "string" ? launchConfig.saleDiscountCode.trim() : "";
    const highlight = launchConfig?.saleDiscountHighlight || "Special Atelier Offer";
    const title = launchConfig?.saleTitle || "THE PRIVATE ARCHIVE EVENT";

    let validity = "Limited allocation event.";
    if (timeLeft && !timeLeft.isExpired) {
      validity = `Ends in ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m.`;
    }

    const replyText = adminCode
      ? `Active Atelier Promotion — ${title}:\n• Discount: ${highlight} across signature pieces\n• Promotion Code: ${adminCode}\n• Duration: ${validity}\n\nEnter code **${adminCode}** at checkout to apply your discount.`
      : `Active Atelier Promotion — ${title}:\n• Discount: ${highlight} across signature pieces\n• Duration: ${validity}\n\nNo promo code is required — promotional atelier pricing is automatically applied at checkout.`;

    messages.push({
      id: `msg-${Date.now()}-sale-details`,
      sender: "bot",
      text: replyText,
      saleDiscountCard: {
        highlight,
        code: adminCode || undefined,
        description: launchConfig?.saleDescription || "Enjoy exclusive limited-time atelier pricing across selected solitaires, minimal rings, and pavé bands.",
        validUntil: validity,
        ctaUrl: launchConfig?.saleCtaUrl || "/collections",
      },
      options: [
        { label: "Find a piece for myself", value: "myself" },
        { label: "Find a gift", value: "gift" },
        { label: "Explore collections", value: "collections" },
      ],
      timestamp: time,
    });
    return { nextState: { currentFlow: null, step: 0, data: nextData, surfacedProducts: surfaced }, messages };
  }

  // ── MYSELF JOURNEY ─────────────────────────────────────────────────────────
  if (nextFlow === "myself") {
    if (nextStep === 1) {
      nextStep = 2;
      messages.push({
        id: `msg-${Date.now()}-1`,
        sender: "bot",
        text: "What category are you shopping for?",
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
        text: `Here are signature pieces selected for you based on your aesthetic preference:`,
        products: filtered,
        options: [
          { label: "Compare a couple of these", value: "trigger-compare" },
          { label: "Explore all collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
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
          text: "What category are you shopping for?",
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
            ? " Standard insured delivery takes 2–4 business days via BlueDart."
            : ""
        }\n\nVRIX pieces arrive in quiet-luxury velvet presentation packaging with authenticity card.`,
        products: picks,
        options: [
          { label: "Find a piece for myself", value: "myself" },
          { label: "Explore collections", value: "collections" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    }
  } else if (nextFlow === "collections") {
    if (nextStep === 1) {
      nextStep = 2;
      messages.push({
        id: `msg-${Date.now()}-col1`,
        sender: "bot",
        text: "Select a signature category to explore:",
        options: [
          { label: "Necklaces", value: "Necklaces" },
          { label: "Earrings", value: "Earrings" },
          { label: "Rings", value: "Rings" },
          { label: "Bracelets", value: "Bracelets" },
          { label: "Bespoke Design", value: "Bespoke" },
        ],
        timestamp: time,
      });
    } else {
      if (actionValue === "Bespoke") {
        nextFlow = null;
        nextStep = 0;
        messages.push({
          id: `msg-${Date.now()}-bespoke`,
          sender: "bot",
          text: "Bespoke creations are handcrafted in our Surat atelier from your custom sketches, metal choice, and stone preferences.",
          bespokeEstimate: {
            pieceType: "Custom Fine Jewelry",
            metalChoice: "18K Solid Gold / 950 Platinum",
            estimatedPriceRange: "₹65,000 – ₹1,80,000",
            leadTime: "3 – 4 Weeks",
          },
          options: [
            { label: "Talk to Concierge", value: "trigger-handoff" },
            { label: "Explore collections", value: "collections" },
          ],
          timestamp: time,
        });
      } else {
        const filtered = filterCatalog(actionValue);
        surfaced = Array.from(new Set([...surfaced, ...filtered]));
        nextFlow = null;
        nextStep = 0;

        messages.push({
          id: `msg-${Date.now()}-col-res`,
          sender: "bot",
          text: `Explore our signature ${actionValue} collection:`,
          products: filtered.length ? filtered : VRIX_CATALOG.slice(0, 3),
          options: [
            { label: "Compare these pieces", value: "trigger-compare" },
            { label: "Find a piece for myself", value: "myself" },
            { label: "Explore other collections", value: "collections" },
          ],
          timestamp: time,
        });
      }
    }
  } else if (nextFlow === "compare" || actionValue === "trigger-compare") {
    const compPicks = surfaced.length >= 2 ? surfaced.slice(0, 3) : VRIX_CATALOG.slice(0, 2);
    nextFlow = null;
    nextStep = 0;

    messages.push({
      id: `msg-${Date.now()}-cmp`,
      sender: "bot",
      text: "Here is a side-by-side specification comparison of our signature pieces:",
      comparison: { products: compPicks },
      options: [
        { label: "Find a piece for myself", value: "myself" },
        { label: "Diamond Education", value: "education" },
        { label: "Talk to concierge", value: "trigger-handoff" },
      ],
      timestamp: time,
    });
  } else if (nextFlow === "education" || actionValue === "education") {
    if (nextStep === 1) {
      nextStep = 2;
      messages.push({
        id: `msg-${Date.now()}-edu-1`,
        sender: "bot",
        text: "What would you like to explore about our materials and craftsmanship?",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Lab vs. Mined Diamonds", value: "Sourcing" },
          { label: "Metal Purity Guide", value: "Metals" },
        ],
        timestamp: time,
      });
    } else {
      nextFlow = null;
      nextStep = 0;
      const eduOptions =
        activeMode === "LAUNCH"
          ? [
              { label: "When is the Launch?", value: "launch_date" },
              { label: "Join VIP Waitlist", value: "launch_waitlist" },
              { label: "Instagram & Facebook", value: "social_channels" },
            ]
          : [
              { label: "The 4Cs of Diamonds", value: "4Cs" },
              { label: "Metal Purity Guide", value: "Metals" },
              { label: "Explore collections", value: "collections" },
            ];

      const launchAdditions =
        activeMode === "LAUNCH"
          ? {
              emailCollector: {
                placeholder: "Enter email for VIP early access...",
                buttonText: "Join VIP Waitlist",
              },
              socialLinks: {
                title: "Follow VRIX Atelier",
                description: "Official releases, previews, and live countdown stories.",
                instagram: "https://www.instagram.com/vrix.official",
                facebook: "https://www.facebook.com/profile.php?id=61588375466280",
              },
            }
          : {};

      if (actionValue === "4Cs") {
        messages.push({
          id: `msg-${Date.now()}-4cs`,
          sender: "bot",
          text: "The 4Cs of VRIX Diamonds:\n• Cut: Precision faceted for maximum light refraction.\n• Color: D–F colorless grades.\n• Clarity: VS+ eye-clean clarity with zero visible inclusions.\n• Carat: Measured with millimeter precision for optical balance.",
          options: eduOptions,
          ...launchAdditions,
          timestamp: time,
        });
      } else if (actionValue === "Sourcing") {
        messages.push({
          id: `msg-${Date.now()}-src`,
          sender: "bot",
          text: "VRIX Lab Diamonds:\nChemically, physically, and optically identical to mined diamonds (Carbon crystal structure, 10 on Mohs scale). Created with renewable energy, zero earth-mining disruption, and 100% conflict-free origin with IGI certification.",
          options: eduOptions,
          ...launchAdditions,
          timestamp: time,
        });
      } else {
        messages.push({
          id: `msg-${Date.now()}-met`,
          sender: "bot",
          text: "VRIX Metal Purity:\n• 18K Solid Gold: Deep lustre and durable skin comfort.\n• 18K Gold Vermeil: Heavy 2.5µm solid gold bonded over pure 925 sterling silver.\n• 925 Sterling Silver: Hypoallergenic nickel-free base.",
          options: eduOptions,
          ...launchAdditions,
          timestamp: time,
        });
      }
    }
  } else if (actionValue === "trigger-handoff" || actionValue === "Talk to concierge") {
    messages.push({
      id: `msg-${Date.now()}-ho`,
      sender: "bot",
      text: "Our private client concierge associates are available for personal styling, custom bespoke orders, and order assistance.",
      handoff: getHandoffData(),
      options: [
        { label: "Find a piece for myself", value: "myself" },
        { label: "Explore collections", value: "collections" },
      ],
      timestamp: time,
    });
  } else {
    // Free text matching with fast FAQ / policy recognition
    const textInput = (userLabel || actionValue || "").trim();
    const qLower = textInput.toLowerCase();

    // Fast Policy Matching
    if (qLower.includes("return") || qLower.includes("exchange") || qLower.includes("refund")) {
      messages.push({
        id: `msg-${Date.now()}-policy-ret`,
        sender: "bot",
        text: "VRIX Returns & Exchange Policy:\n• 15-Day Complimentary Returns: Unworn pieces in original presentation packaging are eligible for full refund or exchange.\n• Lifetime Buyback & Exchange: Available on all lab diamond solitaires.\n• Dedicated insured return pickup arranged by our concierge.",
        options: [
          { label: "Shipping Schedule", value: "Shipping Schedule" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    } else if (qLower.includes("ship") || qLower.includes("deliver") || qLower.includes("tracking") || qLower.includes("track order")) {
      messages.push({
        id: `msg-${Date.now()}-policy-ship`,
        sender: "bot",
        text: "VRIX Insured Shipping & Delivery:\n• Pan-India: 2–4 business days via BlueDart Air Express with full insurance.\n• International: 5–7 business days via DHL Express.\n• Signature required upon delivery for complete security.",
        options: [
          { label: "Return Policy", value: "Return Policy" },
          { label: "Talk to concierge", value: "trigger-handoff" },
        ],
        timestamp: time,
      });
    } else if (qLower.includes("size") || qLower.includes("ring size")) {
      messages.push({
        id: `msg-${Date.now()}-policy-size`,
        sender: "bot",
        text: "VRIX International Ring Sizing Guide:\n• Size 5 (US): 15.7 mm inner diameter\n• Size 6 (US): 16.5 mm inner diameter\n• Size 7 (US): 17.3 mm inner diameter\n• Size 8 (US): 18.2 mm inner diameter\n\nWe provide 1 complimentary resize within 30 days of delivery.",
        options: [
          { label: "Talk to concierge", value: "trigger-handoff" },
          { label: "Explore collections", value: "collections" },
        ],
        timestamp: time,
      });
    } else if (qLower.includes("real") || qLower.includes("fake") || qLower.includes("lab diamond") || qLower.includes("natural")) {
      messages.push({
        id: `msg-${Date.now()}-policy-diamond`,
        sender: "bot",
        text: "Are VRIX diamonds real?\nYes, 100%. VRIX lab-grown diamonds are authentic crystallized carbon with identical chemical, physical, and optical properties to mined diamonds. They pass standard diamond thermal testers and come with independent gemological laboratory certification (IGI).",
        options: [
          { label: "The 4Cs of Diamonds", value: "4Cs" },
          { label: "Explore collections", value: "collections" },
        ],
        timestamp: time,
      });
    } else {
      if (activeMode === "LAUNCH") {
        messages.push({
          id: `msg-${Date.now()}-launch-preview`,
          sender: "bot",
          text: `Our architectural fine jewelry collections and signature lab diamond solitaires will be officially unveiled on launch day.\n\nEnter your email below to join our private VIP waitlist for early access, or follow our preview stories on Instagram and Facebook:`,
          emailCollector: {
            placeholder: "your.email@example.com",
            buttonText: "Notify Me",
            successMessage: launchConfig?.waitlistSuccessMsg || "Thank you. You have been added to our private VIP launch waitlist.",
          },
          socialLinks: {
            title: "Follow VRIX Atelier",
            description: "Official releases, atelier previews, and live countdown stories.",
            instagram: "https://www.instagram.com/vrix.official",
            facebook: "https://www.facebook.com/profile.php?id=61588375466280",
            whatsapp: "https://wa.me/919054285693?text=Hi%20VRIX%20Concierge,%20I%20have%20an%20inquiry%20regarding%20the%20upcoming%20launch.",
          },
          options: [
            { label: "When is the Launch?", value: "launch_date" },
            { label: "Join VIP Waitlist", value: "launch_waitlist" },
            { label: "Instagram & Facebook", value: "social_channels" },
            { label: "About VRIX Lab Diamonds", value: "education" },
          ],
          timestamp: time,
        });
      } else {
        const parsed = parseUserQuery(textInput);
        const results = (parsed.category || parsed.budgetStr) ? filterCatalog(parsed.category, parsed.budgetStr) : [];

        if (results.length > 0) {
          messages.push({
            id: `msg-${Date.now()}-fb`,
            sender: "bot",
            text: `Here are signature pieces matching your search:`,
            products: results,
            options: [
              { label: "Compare these pieces", value: "trigger-compare" },
              { label: "Talk to concierge", value: "trigger-handoff" },
            ],
            timestamp: time,
          });
        } else {
          messages.push({
            id: `msg-${Date.now()}-fb-def`,
            sender: "bot",
            text: "I would be delighted to assist you with finding the ideal piece or answering any craftsmanship questions. You may also connect directly with our client concierge:",
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
    }
  }

  // Strict enforcement: in LAUNCH mode, NEVER allow any products or comparisons to be displayed
  if (activeMode === "LAUNCH") {
    messages.forEach((m) => {
      m.products = undefined;
      m.comparison = undefined;
      m.saleDiscountCard = undefined;
    });
  }

  return {
    nextState: {
      currentFlow: activeMode === "LAUNCH" ? null : nextFlow,
      step: activeMode === "LAUNCH" ? 0 : nextStep,
      data: nextData,
      surfacedProducts: activeMode === "LAUNCH" ? [] : surfaced,
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
  else if (q.includes("bracelet") || q.includes("cuff") || q.includes("bangle")) category = "Bracelets";

  let budgetStr: string | undefined;
  if (q.includes("15k") || q.includes("15000") || q.includes("under 15")) budgetStr = "15000";
  else if (q.includes("40k") || q.includes("40000")) budgetStr = "40000";
  else if (q.includes("75k") || q.includes("75000")) budgetStr = "75000";

  return { category, budgetStr };
}

export function getHandoffData(): HumanHandoffData {
  return {
    title: "VRIX Private Concierge",
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
