"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBespokeData } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SkeletonImage from "@/components/shop/SkeletonImage";

// Luxury SVG Placeholder Component for missing variant images
const LuxuryPlaceholderImage = ({ title, metal }: { title: string; metal: string }) => (
  <div className="w-full h-full min-h-[380px] md:min-h-[550px] flex flex-col items-center justify-center bg-gradient-to-b from-surface/30 via-soft-linen to-surface/80 p-8 text-center border border-slate-grey/15">
    <div className="w-24 h-24 rounded-full border border-deep-navy/20 flex items-center justify-center mb-6 bg-pure-white/80 shadow-inner">
      <span className="material-symbols-outlined text-4xl text-deep-navy font-light">diamond</span>
    </div>
    <span className="font-label-caps text-[10px] text-slate-grey tracking-widest uppercase mb-1">ATELIER VRIX CUSTOM COMMISSION</span>
    <h3 className="font-display-md text-xl text-deep-navy uppercase font-medium">{title}</h3>
    <p className="font-body-md text-xs text-slate-grey mt-2 max-w-sm">
      Render Preview for <strong className="text-deep-navy">{metal}</strong> being finalized by our master atelier.
    </p>
  </div>
);

export default function Page() {
  const router = useRouter();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("silhouette");

  // CMS Data
  const [settings, setSettings] = useState<any>({
    headline: "Bespoke Atelier Estimate",
    slogan: "THE SIGNATURE COLLECTION",
    subtitle: "Crafted to your exact specifications. Begin building your legacy piece.",
    introParagraph: "Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.",
    disclaimerText: "Final quote verified during 1-on-1 consultation with our lead master craftsman.",
    consultationCtaText: "Book Atelier Consultation",
    craftingTimeline: "3 – 4 Weeks",
    baseMinPrice: 65000,
    baseMaxPrice: 180000,
    isEnabled: true,
  });

  const [metals, setMetals] = useState<any[]>([]);
  const [silhouettes, setSilhouettes] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // Selection state
  const [selectedSilhouette, setSelectedSilhouette] = useState<any>(null);
  const [selectedMetal, setSelectedMetal] = useState<any>(null);
  const [selectedShape, setSelectedShape] = useState<any>(null);
  const [carat, setCarat] = useState(1.5);
  const [engraving, setEngraving] = useState("");
  const [addingToBag, setAddingToBag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBespokeData()
      .then((res) => {
        if (res.settings) {
          setSettings(res.settings);
        }
        const loadedSilhouettes = res.silhouettes || [];
        const loadedMetals = res.metals || [];
        const loadedShapes = res.shapes || [];

        setSilhouettes(loadedSilhouettes);
        setMetals(loadedMetals);
        setShapes(loadedShapes);
        setVariants(res.variants || []);

        if (loadedSilhouettes.length > 0) setSelectedSilhouette(loadedSilhouettes[0]);
        if (loadedMetals.length > 0) setSelectedMetal(loadedMetals[0]);
        if (loadedShapes.length > 0) setSelectedShape(loadedShapes[0]);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading bespoke data:", err);
        setLoading(false);
      });
  }, []);

  // Reactive Variant Image Resolver
  const resolveCurrentPreviewImage = () => {
    if (!selectedSilhouette || !selectedMetal) return null;

    const silCode = selectedSilhouette.code || selectedSilhouette.name;
    const metalCode = selectedMetal.code || selectedMetal.name;
    const shapeCode = selectedShape ? (selectedShape.code || selectedShape.name) : null;

    // 1. Try exact match (silhouette + metal + stoneShape)
    if (shapeCode && variants.length > 0) {
      const match = variants.find(
        (v) =>
          v.silhouette.toUpperCase() === silCode.toUpperCase() &&
          v.metal.toUpperCase() === metalCode.toUpperCase() &&
          v.stoneShape && v.stoneShape.toUpperCase() === shapeCode.toUpperCase()
      );
      if (match && match.imageUrl) return match.imageUrl;
    }

    // 2. Try match without stone shape (silhouette + metal)
    if (variants.length > 0) {
      const match = variants.find(
        (v) =>
          v.silhouette.toUpperCase() === silCode.toUpperCase() &&
          v.metal.toUpperCase() === metalCode.toUpperCase()
      );
      if (match && match.imageUrl) return match.imageUrl;
    }

    // 3. Fallback to metal default image URL
    if (selectedMetal.imageUrl) return selectedMetal.imageUrl;

    // 4. Fallback to silhouette default image URL
    if (selectedSilhouette.imageUrl) return selectedSilhouette.imageUrl;

    return null;
  };

  // Dynamic Price Calculator based on base ranges + carat weight + option multipliers
  const calculatePriceRange = () => {
    const metalMult = selectedMetal?.priceMultiplier || 1.0;
    const silMult = selectedSilhouette?.priceMultiplier || 1.0;
    const shapeMult = selectedShape?.priceMultiplier || 1.0;

    const caratScale = carat / 1.5;
    const combinedMult = metalMult * silMult * shapeMult * caratScale;

    const minPrice = Math.round(settings.baseMinPrice * combinedMult);
    const maxPrice = Math.round(settings.baseMaxPrice * combinedMult);

    return { minPrice, maxPrice };
  };

  const { minPrice, maxPrice } = calculatePriceRange();
  const previewImageUrl = resolveCurrentPreviewImage();

  const handleAddToBag = () => {
    if (!isLoggedIn) {
      setToastMessage("Please sign in to book your consultation & save piece.");
      setTimeout(() => router.push("/account"), 1200);
      return;
    }

    setAddingToBag(true);
    setTimeout(() => {
      addItem({
        id: `bespoke-${Date.now()}`,
        title: `${selectedSilhouette?.name || "Bespoke Piece"} (${selectedShape?.name || "Custom"} Cut)`,
        price: minPrice,
        image: previewImageUrl || "",
        material: `${selectedMetal?.name || "18K Gold"} • ${carat} ct Diamond`,
        size: `${carat} ct`,
        engraving,
      });
      setAddingToBag(false);
      setToastMessage(`Custom ${selectedSilhouette?.name || "Piece"} added to your bag!`);
      setTimeout(() => setToastMessage(null), 3500);
    }, 600);
  };

  if (loading) {
    return (
      <div className="w-full bg-surface min-h-screen flex items-center justify-center">
        <p className="font-body-md text-slate-grey animate-pulse uppercase tracking-widest text-xs">
          Loading Atelier Configurator...
        </p>
      </div>
    );
  }

  if (!settings?.isEnabled || (metals.length === 0 && silhouettes.length === 0)) {
    return (
      <div className="w-full bg-surface min-h-[calc(100vh-65px)] flex items-center justify-center py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-xl text-center space-y-8 bg-pure-white border border-slate-grey/15 p-8 md:p-12 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-full border border-slate-grey/25 bg-soft-linen/50 flex items-center justify-center mx-auto text-deep-navy">
            <span className="material-symbols-outlined text-3xl font-light">hourglass_disabled</span>
          </div>
          <div className="space-y-3">
            <p className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
              Atelier VRIX
            </p>
            <h1 className="font-display-lg text-headline-lg text-deep-navy uppercase">
              Bespoke Atelier Currently Busy
            </h1>
            <div className="w-12 h-px bg-slate-grey/30 mx-auto"></div>
          </div>
          <p className="font-body-md text-sm text-slate-grey leading-relaxed">
            Our master goldsmiths are currently at full capacity crafting custom atelier creations. Please check back a little later or contact customer care for urgent bespoke inquiries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/contact"
              className="inline-block font-button text-xs uppercase px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer text-center"
            >
              Contact Customer Care
            </Link>
            <Link
              href="/collections"
              className="inline-block font-button text-xs uppercase px-6 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer text-center"
            >
              Discover Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative pt-4 md:pt-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-deep-navy text-pure-white px-5 py-3 text-xs font-body-md shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-grey/20">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-grow flex flex-col md:flex-row overflow-hidden relative min-h-[calc(100vh-120px)]">

        {/* Dynamic Image Visualizer */}
        <section className="flex-grow bg-pure-white relative flex items-center justify-center p-margin-mobile md:p-margin-desktop order-1 md:order-1 min-h-[420px] md:min-h-[600px] w-full thin-border md:border-r md:border-b-0 border-b">
          <div className="w-full h-full min-h-[380px] md:min-h-[550px] max-w-2xl relative flex items-center justify-center group">
            {previewImageUrl ? (
              <SkeletonImage
                alt={selectedSilhouette?.name || settings.headline}
                fill
                className="max-h-full object-contain transition-all duration-700 ease-in-out group-hover:scale-102"
                src={previewImageUrl}
                sizes="(max-width: 1024px) 100vw, 600px"
                priority
              />
            ) : (
              <LuxuryPlaceholderImage
                title={selectedSilhouette?.name || "Custom Piece"}
                metal={selectedMetal?.name || "18K Gold"}
              />
            )}

            <div className="absolute bottom-stack-md left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-slate-grey opacity-75 font-label-caps text-label-caps bg-pure-white/90 px-4 py-1.5 border border-slate-grey/20 backdrop-blur-xs shadow-xs">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="tracking-widest uppercase">
                {selectedSilhouette?.name} • {selectedMetal?.name} {selectedShape ? `• ${selectedShape.name}` : ""}
              </span>
            </div>
          </div>
        </section>

        {/* Configurator Controls Sidebar */}
        <section className="w-full md:w-[420px] lg:w-[480px] bg-soft-linen flex flex-col order-2 md:order-2 z-10 flex-shrink-0">
          <div className="flex-grow overflow-y-auto px-margin-mobile md:px-stack-lg py-stack-lg no-scrollbar">

            {/* Header Copy from CMS */}
            <div className="mb-6 space-y-2">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold block">
                {settings.slogan}
              </span>
              <h1 className="font-display-lg text-headline-lg text-ink-black leading-tight">
                {settings.headline}
              </h1>
              <p className="font-body-md text-xs text-slate-grey leading-relaxed">
                {settings.introParagraph}
              </p>
              {settings.subtitle && (
                <p className="font-body-md text-xs text-slate-grey/80 italic mt-1">
                  {settings.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-0 thin-border border-t border-b border-slate-grey/20">

              {/* 1. Silhouette Selection */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button
                  className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
                  onClick={() => setActiveSection(activeSection === "silhouette" ? "" : "silhouette")}
                >
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy font-semibold uppercase">
                    1. SILHOUETTE ({selectedSilhouette?.name || "SELECT"})
                  </span>
                  <span className="material-symbols-outlined text-slate-grey">
                    {activeSection === "silhouette" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "silhouette" ? "" : "hidden"}`}>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {silhouettes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSilhouette(s)}
                        className={`p-3 text-left border transition-all cursor-pointer ${
                          selectedSilhouette?.id === s.id
                            ? "border-deep-navy bg-pure-white shadow-xs font-bold text-deep-navy"
                            : "border-slate-grey/20 bg-surface/60 hover:border-slate-grey/40 text-slate-grey"
                        }`}
                      >
                        <span className="font-label-caps text-[11px] block uppercase">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Metal & Setting Selection */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button
                  className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
                  onClick={() => setActiveSection(activeSection === "metal" ? "" : "metal")}
                >
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy font-semibold uppercase">
                    2. METAL &amp; SETTING ({selectedMetal?.name || "SELECT"})
                  </span>
                  <span className="material-symbols-outlined text-slate-grey">
                    {activeSection === "metal" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "metal" ? "" : "hidden"}`}>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {metals.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMetal(m)}
                        className={`p-3 text-center border transition-all cursor-pointer ${
                          selectedMetal?.id === m.id
                            ? "border-deep-navy bg-pure-white shadow-xs font-bold text-deep-navy"
                            : "border-slate-grey/20 bg-surface/60 hover:border-slate-grey/40 text-slate-grey"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-2 border border-black/10 shadow-inner"
                          style={{ backgroundColor: m.colorHex || "#CCCCCC" }}
                        />
                        <span className="font-label-caps text-[10px] block uppercase font-semibold">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Stone & Shape Selection */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button
                  className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
                  onClick={() => setActiveSection(activeSection === "stone" ? "" : "stone")}
                >
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy font-semibold uppercase">
                    3. STONE CUT ({carat} CT {selectedShape?.name || ""})
                  </span>
                  <span className="material-symbols-outlined text-slate-grey">
                    {activeSection === "stone" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "stone" ? "" : "hidden"}`}>
                  {/* Carat Weight Slider */}
                  <div className="my-3">
                    <div className="flex justify-between items-end mb-2">
                      <label className="font-label-caps text-[10px] text-ink-black uppercase font-semibold">CARAT WEIGHT</label>
                      <span className="font-body-md text-xs font-bold text-deep-navy">{carat.toFixed(2)} ct</span>
                    </div>
                    <input
                      className="w-full h-1 bg-slate-grey/20 rounded-full appearance-none cursor-pointer accent-deep-navy"
                      max={4.0}
                      min={0.5}
                      step="0.1"
                      type="range"
                      value={carat}
                      onChange={(e) => setCarat(Number(e.target.value))}
                    />
                  </div>

                  {/* Stone Shapes */}
                  <div className="mt-4">
                    <label className="font-label-caps text-[10px] text-ink-black block mb-2 font-semibold uppercase">SHAPE CHOICE</label>
                    <div className="grid grid-cols-2 gap-2">
                      {shapes.map((sh) => (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => setSelectedShape(sh)}
                          className={`px-3 py-2 border text-center transition-all text-[10px] font-label-caps font-semibold uppercase cursor-pointer ${
                            selectedShape?.id === sh.id
                              ? "border-deep-navy bg-pure-white text-deep-navy shadow-xs font-bold"
                              : "border-slate-grey/25 text-slate-grey hover:border-slate-grey/50"
                          }`}
                        >
                          {sh.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Engraving / Personalization */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button
                  className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
                  onClick={() => setActiveSection(activeSection === "personalize" ? "" : "personalize")}
                >
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy font-semibold uppercase">
                    4. ENGRAVING {engraving ? `("${engraving}")` : "(OPTIONAL)"}
                  </span>
                  <span className="material-symbols-outlined text-slate-grey">
                    {activeSection === "personalize" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "personalize" ? "" : "hidden"}`}>
                  <input
                    className="w-full bg-pure-white border border-slate-grey/30 focus:border-deep-navy px-3 py-2 font-body-md text-xs text-ink-black outline-none mt-2"
                    placeholder="Enter custom engraving initials or date"
                    type="text"
                    value={engraving}
                    maxLength={20}
                    onChange={(e) => setEngraving(e.target.value)}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Estimation & Consultation CTA */}
          <div className="bg-pure-white border-t border-slate-grey/20 p-margin-mobile md:px-stack-lg md:py-5 flex-none z-20 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-body-md border-b border-slate-grey/15 pb-3">
              <div>
                <span className="block text-[9px] font-label-caps text-slate-grey uppercase font-semibold">ESTIMATED RANGE</span>
                <span className="font-bold text-sm text-deep-navy">
                  ₹{minPrice.toLocaleString("en-IN")} – ₹{maxPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-label-caps text-slate-grey uppercase font-semibold">CRAFTING TIME</span>
                <span className="font-bold text-xs text-ink-black">{settings.craftingTimeline}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-grey italic leading-tight">
              {settings.disclaimerText}
            </p>

            <button
              onClick={handleAddToBag}
              disabled={addingToBag}
              className="w-full bg-deep-navy text-pure-white font-button text-button text-xs uppercase py-4 hover:bg-ink-black transition-colors flex justify-center items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {addingToBag ? (
                <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{settings.consultationCtaText}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
