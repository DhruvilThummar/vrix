"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchDbPublic as fetchDb } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SkeletonImage from "@/components/shop/SkeletonImage";

const DEFAULT_BESPOKE_CONFIG = {
  slogan: "THE SIGNATURE COLLECTION",
  title: "Bespoke Solitaire",
  subtitle: "Crafted to your exact specifications. Begin building your legacy piece.",
  previewImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAks29fjlA1gotrInXcRvND6geEa51LDm7VTLCZxzQ5SMp7ppo1sLy6YvXWHNXvmv8aU5VUCKZxNgW5V1LK4m9kpD_0gx3-rUg_1dE4tM-ddxE6LIxo6Co86x_O2yLAJmlADHnZJiJMMkiAkkmesYshx4QzL2WLq-rpFbMRQR3aMVFX7IjXVLijUS-lPVPY1hj4O3PV22zApoxyWBrnbLLkxgsqKHK4K9foEioe7RLFuP1K1emgpmp5yITLuyDe3rDmd-904NOjbvw",
  basePrice: 3450,
  metals: [
    { name: "18K YELLOW GOLD", color: "#E6C762" },
    { name: "18K WHITE GOLD", color: "#E1E1E1" },
    { name: "18K ROSE GOLD", color: "#E8B2A1" },
    { name: "PLATINUM", color: "#D1D3D4" }
  ],
  shapes: ["ROUND", "OVAL", "EMERALD", "PEAR"],
  caratMin: 0.5,
  caratMax: 3.0,
  caratDefault: 1.5,
  engravingMax: 15
};

export default function Page() {
  const router = useRouter();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();

  const [activeSection, setActiveSection] = useState("metal");
  const [loading, setLoading] = useState(true);
  const [bespokeEnabled, setBespokeEnabled] = useState(true);
  const [config, setConfig] = useState(DEFAULT_BESPOKE_CONFIG);

  // Configurator state
  const [selectedMetal, setSelectedMetal] = useState("18K YELLOW GOLD");
  const [selectedShape, setSelectedShape] = useState("ROUND");
  const [carat, setCarat] = useState(1.5);
  const [engraving, setEngraving] = useState("");
  const [addingToBag, setAddingToBag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.features && res.features.bespokeEnabled !== undefined) {
          setBespokeEnabled(res.features.bespokeEnabled);
        }
        if (res.bespoke_config) {
          const loadedMetals = Array.isArray(res.bespoke_config.metals) && res.bespoke_config.metals.length > 0
            ? res.bespoke_config.metals
            : DEFAULT_BESPOKE_CONFIG.metals;
          const loadedShapes = Array.isArray(res.bespoke_config.shapes) && res.bespoke_config.shapes.length > 0
            ? res.bespoke_config.shapes
            : DEFAULT_BESPOKE_CONFIG.shapes;

          const merged = {
            slogan: res.bespoke_config.slogan || DEFAULT_BESPOKE_CONFIG.slogan,
            title: res.bespoke_config.title || DEFAULT_BESPOKE_CONFIG.title,
            subtitle: res.bespoke_config.subtitle || DEFAULT_BESPOKE_CONFIG.subtitle,
            previewImage: res.bespoke_config.previewImage || DEFAULT_BESPOKE_CONFIG.previewImage,
            basePrice: Number(res.bespoke_config.basePrice) || DEFAULT_BESPOKE_CONFIG.basePrice,
            metals: loadedMetals,
            shapes: loadedShapes,
            caratMin: Number(res.bespoke_config.caratMin) || DEFAULT_BESPOKE_CONFIG.caratMin,
            caratMax: Number(res.bespoke_config.caratMax) || DEFAULT_BESPOKE_CONFIG.caratMax,
            caratDefault: Number(res.bespoke_config.caratDefault) || DEFAULT_BESPOKE_CONFIG.caratDefault,
            engravingMax: Number(res.bespoke_config.engravingMax) || DEFAULT_BESPOKE_CONFIG.engravingMax,
          };
          setConfig(merged);
          setSelectedMetal(loadedMetals[0]?.name || "18K YELLOW GOLD");
          setSelectedShape(loadedShapes[0] || "ROUND");
          setCarat(merged.caratDefault);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading bespoke configurator:", err);
        setLoading(false);
      });
  }, []);

  // Price multiplier based on carat weight
  const calculatedPrice = Math.round(config.basePrice * (carat / (config.caratDefault || 1)));

  const handleAddToBag = () => {
    if (!isLoggedIn) {
      setToastMessage("Please sign in to add bespoke items to your bag.");
      setTimeout(() => router.push("/account"), 1200);
      return;
    }

    setAddingToBag(true);
    setTimeout(() => {
      addItem({
        id: `bespoke-${Date.now()}`,
        title: `${config.title} (${selectedShape} Cut)`,
        price: calculatedPrice,
        image: config.previewImage,
        material: `${selectedMetal} • ${carat} ct Diamond`,
        size: `${carat} ct`,
        engraving,
      });
      setAddingToBag(false);
      setToastMessage(`Your custom ${selectedShape} ${config.title} added to bag!`);
      setTimeout(() => setToastMessage(null), 3500);
    }, 600);
  };

  if (loading) {
    return (
      <div className="w-full bg-surface min-h-screen flex items-center justify-center">
        <p className="font-body-md text-slate-grey animate-pulse uppercase tracking-widest text-xs">
          Loading atelier configurator...
        </p>
      </div>
    );
  }

  if (!bespokeEnabled) {
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
              Bespoke Services at Capacity
            </h1>
            <div className="w-12 h-px bg-slate-grey/30 mx-auto"></div>
          </div>
          <p className="font-body-md text-sm text-slate-grey leading-relaxed">
            To ensure the highest standard of craftsmanship for our existing custom commissions, we are temporarily pausing new bespoke ring configurations. We limit our monthly custom project intake to maintain our precise quality standards.
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
    <div className="w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-deep-navy text-pure-white px-5 py-3 text-xs font-body-md shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-grey/20">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-grow flex flex-col md:flex-row overflow-hidden relative min-h-[calc(100vh-120px)]">

        {/* 3D / Configurator Image Visualizer */}
        <section className="flex-grow bg-pure-white relative flex items-center justify-center p-margin-mobile md:p-margin-desktop order-1 md:order-1 min-h-[420px] md:min-h-[600px] w-full thin-border md:border-r md:border-b-0 border-b">
          <div className="w-full h-full min-h-[380px] md:min-h-[550px] max-w-2xl relative flex items-center justify-center group cursor-crosshair">
            <SkeletonImage
              alt={config.title}
              fill
              className="max-h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-102"
              src={config.previewImage}
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
            />
            <div className="absolute bottom-stack-md left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-slate-grey opacity-50 font-label-caps text-label-caps bg-pure-white/80 px-3 py-1 border border-slate-grey/20 backdrop-blur-xs">
              <span className="material-symbols-outlined text-sm">360</span>
              <span>ATELIER PREVIEW · {selectedShape} / {selectedMetal}</span>
            </div>
          </div>
        </section>

        {/* Configurator Controls Sidebar */}
        <section className="w-full md:w-[400px] lg:w-[480px] bg-soft-linen flex flex-col order-2 md:order-2 h-1/2 md:h-full z-10 flex-shrink-0">
          <div className="flex-grow overflow-y-auto px-margin-mobile md:px-stack-lg py-stack-lg no-scrollbar">
            
            {/* Header copy */}
            <div className="mb-stack-lg">
              <p className="font-label-caps text-xs text-slate-grey mb-2 uppercase tracking-widest">{config.slogan}</p>
              <h1 className="font-display-lg text-headline-lg text-ink-black leading-tight">{config.title}</h1>
              <p className="font-body-md text-sm text-slate-grey mt-2">{config.subtitle}</p>
            </div>

            <div className="space-y-0 thin-border border-t border-b border-slate-grey/20">
              
              {/* 1. Metal Selection */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "metal" ? "" : "metal")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">
                    1. CHOOSE METAL ({selectedMetal})
                  </span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">
                    {activeSection === "metal" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "metal" ? "" : "hidden"}`}>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {config.metals.map((m: any) => (
                      <label key={m.name} className="cursor-pointer" onClick={() => setSelectedMetal(m.name)}>
                        <input checked={selectedMetal === m.name} onChange={() => setSelectedMetal(m.name)} className="peer sr-only" name="metal" type="radio" />
                        <div className={`border p-3 text-center transition-all ${selectedMetal === m.name ? "border-deep-navy bg-pure-white shadow-sm" : "border-slate-grey/20 bg-surface/60 hover:border-slate-grey/40"}`}>
                          <div className="w-6 h-6 rounded-full mx-auto mb-2 shadow-inner border border-black/10" style={{ backgroundColor: m.color || "#CCCCCC" }}></div>
                          <span className="font-label-caps text-[10px] block font-semibold text-deep-navy">{m.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Stone Selection */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "stone" ? "" : "stone")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">
                    2. CHOOSE STONE ({carat} CT {selectedShape})
                  </span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">
                    {activeSection === "stone" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "stone" ? "" : "hidden"}`}>
                  <p className="font-body-md text-xs text-slate-grey mb-4 mt-2">Select from our curated collection of ethical, lab-grown diamonds.</p>
                  
                  {/* Carat Slider */}
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <label className="font-label-caps text-[10px] text-ink-black uppercase font-semibold">CARAT WEIGHT</label>
                      <span className="font-body-md text-xs font-bold text-deep-navy">{carat.toFixed(2)} ct</span>
                    </div>
                    <input 
                      className="w-full h-1 bg-slate-grey/20 rounded-full appearance-none cursor-pointer focus:outline-none accent-deep-navy" 
                      max={config.caratMax} 
                      min={config.caratMin} 
                      step="0.1" 
                      type="range" 
                      value={carat}
                      onChange={(e) => setCarat(Number(e.target.value))} 
                    />
                    <div className="flex justify-between text-[10px] text-slate-grey mt-1 font-label-caps">
                      <span>{config.caratMin} ct</span>
                      <span>{config.caratMax}+ ct</span>
                    </div>
                  </div>

                  {/* Stone Shape Picker */}
                  <div className="mb-2">
                    <label className="font-label-caps text-[10px] text-ink-black block mb-2 font-semibold">SHAPE</label>
                    <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                      {config.shapes.map((shape) => (
                        <button 
                          key={shape} 
                          type="button"
                          onClick={() => setSelectedShape(shape)}
                          className={`flex-shrink-0 px-4 py-2 border text-center transition-all text-[10px] font-label-caps font-semibold cursor-pointer ${selectedShape === shape ? "border-deep-navy bg-pure-white text-deep-navy shadow-xs" : "border-slate-grey/25 text-slate-grey hover:border-slate-grey/50"}`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Personalize / Engraving */}
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "personalize" ? "" : "personalize")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">
                    3. PERSONALIZE {engraving ? `("${engraving}")` : "(OPTIONAL)"}
                  </span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">
                    {activeSection === "personalize" ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "personalize" ? "" : "hidden"}`}>
                  <div className="mt-4 relative">
                    <div className="flex justify-between items-center text-[9px] font-label-caps text-slate-grey uppercase mb-1">
                      <span>ENGRAVING</span>
                      <span>{engraving.length}/{config.engravingMax}</span>
                    </div>
                    <input 
                      className="w-full bg-pure-white border border-slate-grey/30 focus:border-deep-navy px-3 py-2 font-body-md text-sm text-ink-black placeholder:text-slate-grey/50 transition-colors outline-none" 
                      placeholder={`Enter up to ${config.engravingMax} characters`} 
                      type="text" 
                      value={engraving}
                      maxLength={config.engravingMax}
                      onChange={(e) => setEngraving(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Total & Add to Bag CTA */}
          <div className="bg-pure-white border-t border-slate-grey/20 p-margin-mobile md:px-stack-lg md:py-4 flex-none z-20">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider block">TOTAL ESTIMATE</span>
                <span className="text-[10px] text-slate-grey font-body-md">{carat} ct · {selectedShape} · {selectedMetal}</span>
              </div>
              <span className="font-headline-md text-xl text-deep-navy font-bold">₹{calculatedPrice.toLocaleString("en-IN")}</span>
            </div>

            <button 
              onClick={handleAddToBag}
              disabled={addingToBag}
              className="w-full bg-deep-navy text-pure-white font-button text-button uppercase py-4 hover:bg-ink-black transition-colors flex justify-center items-center space-x-2 rounded-none cursor-pointer disabled:opacity-60"
            >
              {addingToBag ? (
                <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Add Custom Ring to Bag</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-grey mt-2 font-body-md">Complimentary insured shipping &amp; 30-day returns.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
