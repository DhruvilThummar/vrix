"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchDb } from "@/utils/api";

export default function Page() {
  const [activeSection, setActiveSection] = useState("metal");
  const [loading, setLoading] = useState(true);
  const [bespokeEnabled, setBespokeEnabled] = useState(true);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.features && res.features.bespokeEnabled !== undefined) {
          setBespokeEnabled(res.features.bespokeEnabled);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading features configurator:", err);
        setLoading(false);
      });
  }, []);

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
    <div className="w-full">
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden relative">

        <section className="flex-grow bg-pure-white relative flex items-center justify-center p-margin-mobile md:p-margin-desktop order-1 md:order-1 h-1/2 md:h-full thin-border md:border-r md:border-b-0 border-b">
          <div className="w-full h-full max-w-2xl relative flex items-center justify-center group cursor-crosshair">
            <Image
              alt="Customizable Ring"
              fill
              className="max-h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-102"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAks29fjlA1gotrInXcRvND6geEa51LDm7VTLCZxzQ5SMp7ppo1sLy6YvXWHNXvmv8aU5VUCKZxNgW5V1LK4m9kpD_0gx3-rUg_1dE4tM-ddxE6LIxo6Co86x_O2yLAJmlADHnZJiJMMkiAkkmesYshx4QzL2WLq-rpFbMRQR3aMVFX7IjXVLijUS-lPVPY1hj4O3PV22zApoxyWBrnbLLkxgsqKHK4K9foEioe7RLFuP1K1emgpmp5yITLuyDe3rDmd-904NOjbvw"
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
            />
            <div className="absolute bottom-stack-md left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-slate-grey opacity-50 font-label-caps text-label-caps">
              <span className="material-symbols-outlined text-sm">360</span>
              <span>DRAG TO ROTATE</span>
            </div>
          </div>
        </section>

        <section className="w-full md:w-[400px] lg:w-[480px] bg-soft-linen flex flex-col order-2 md:order-2 h-1/2 md:h-full z-10 flex-shrink-0">
          <div className="flex-grow overflow-y-auto px-margin-mobile md:px-stack-lg py-stack-lg no-scrollbar">
            
            <div className="mb-stack-lg">
              <p className="font-label-caps text-xs text-slate-grey mb-2 uppercase tracking-widest">THE SIGNATURE COLLECTION</p>
              <h1 className="font-display-lg text-headline-lg text-ink-black leading-tight">Bespoke Solitaire</h1>
              <p className="font-body-md text-sm text-slate-grey mt-2">Crafted to your exact specifications. Begin building your legacy piece.</p>
            </div>

            <div className="space-y-0 thin-border border-t border-b border-slate-grey/20">
              
              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "metal" ? "" : "metal")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">1. CHOOSE METAL</span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">expand_more</span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "metal" ? "" : "hidden"}`}>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <label className="cursor-pointer">
                      <input defaultChecked={true} className="peer sr-only" name="metal" type="radio" />
                      <div className="border border-slate-grey/20 p-3 text-center peer-checked:border-deep-navy peer-checked:bg-pure-white transition-all bg-surface">
                        <div className="w-6 h-6 rounded-full mx-auto mb-2 bg-[#E6C762] shadow-inner"></div>
                        <span className="font-label-caps text-[10px] block font-semibold">18K YELLOW GOLD</span>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input className="peer sr-only" name="metal" type="radio" />
                      <div className="border border-slate-grey/20 p-3 text-center peer-checked:border-deep-navy peer-checked:bg-pure-white transition-all bg-surface">
                        <div className="w-6 h-6 rounded-full mx-auto mb-2 bg-[#E1E1E1] shadow-inner"></div>
                        <span className="font-label-caps text-[10px] block font-semibold">18K WHITE GOLD</span>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input className="peer sr-only" name="metal" type="radio" />
                      <div className="border border-slate-grey/20 p-3 text-center peer-checked:border-deep-navy peer-checked:bg-pure-white transition-all bg-surface">
                        <div className="w-6 h-6 rounded-full mx-auto mb-2 bg-[#E8B2A1] shadow-inner"></div>
                        <span className="font-label-caps text-[10px] block font-semibold">18K ROSE GOLD</span>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input className="peer sr-only" name="metal" type="radio" />
                      <div className="border border-slate-grey/20 p-3 text-center peer-checked:border-deep-navy peer-checked:bg-pure-white transition-all bg-surface">
                        <div className="w-6 h-6 rounded-full mx-auto mb-2 bg-[#D1D3D4] shadow-inner"></div>
                        <span className="font-label-caps text-[10px] block font-semibold">PLATINUM</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "stone" ? "" : "stone")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">2. CHOOSE STONE</span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">expand_more</span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "stone" ? "" : "hidden"}`}>
                  <p className="font-body-md text-xs text-slate-grey mb-4 mt-2">Select from our curated collection of ethical, lab-grown diamonds.</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <label className="font-label-caps text-[10px] text-ink-black uppercase font-semibold">CARAT WEIGHT</label>
                      <span className="font-body-md text-xs">1.50 ct</span>
                    </div>
                    <input className="w-full h-1 bg-slate-grey/20 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-deep-navy accent-deep-navy" max="3.0" min="0.5" step="0.1" type="range" defaultValue="1.5" />
                    <div className="flex justify-between text-[10px] text-slate-grey mt-1">
                      <span>0.5 ct</span>
                      <span>3.0+ ct</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="font-label-caps text-[10px] text-ink-black block mb-2 font-semibold">SHAPE</label>
                    <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                      {["ROUND", "OVAL", "EMERALD", "PEAR"].map((shape, idx) => (
                        <button key={idx} className="flex-shrink-0 px-4 py-2 border border-slate-grey/25 text-center hover:border-deep-navy focus:border-deep-navy focus:bg-pure-white transition-all text-[10px] font-label-caps font-semibold cursor-pointer">
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="accordion-item thin-border border-b border-slate-grey/25 last:border-b-0">
                <button className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer" onClick={() => setActiveSection(activeSection === "personalize" ? "" : "personalize")}>
                  <span className="font-label-caps text-xs text-ink-black group-hover:text-deep-navy transition-colors font-semibold">3. PERSONALIZE</span>
                  <span className="material-symbols-outlined text-slate-grey transition-transform duration-300">expand_more</span>
                </button>
                <div className={`accordion-content pb-4 ${activeSection === "personalize" ? "" : "hidden"}`}>
                  <div className="mt-4 relative">
                    <label className="font-label-caps text-[9px] text-slate-grey absolute -top-4 left-0 uppercase">ENGRAVING (OPTIONAL)</label>
                    <input className="w-full bg-transparent border-0 border-b border-slate-grey/30 focus:border-deep-navy focus:ring-0 px-0 py-2 font-body-md text-sm text-ink-black placeholder:text-slate-grey/50 transition-colors" placeholder="Enter up to 15 characters" type="text" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-pure-white border-t border-slate-grey/20 p-margin-mobile md:px-stack-lg md:py-4 flex-none z-20">
            <div className="flex justify-between items-end mb-4">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">TOTAL ESTIMATE</span>
              <span className="font-headline-md text-xl text-ink-black font-bold">$3,450</span>
            </div>
            <button className="w-full bg-deep-navy text-pure-white font-button text-button uppercase py-4 hover:bg-opacity-90 transition-opacity flex justify-center items-center space-x-2 rounded-none cursor-pointer">
              <span>Add to Bag</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <p className="text-center text-[10px] text-slate-grey mt-2 font-body-md">Complimentary shipping &amp; returns.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
