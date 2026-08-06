"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS } from "@/utils/api";

export default function AdminBespokePage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configuration States
  const [bespokeEnabled, setBespokeEnabled] = useState(true);
  const [bespokeSlogan, setBespokeSlogan] = useState("THE SIGNATURE COLLECTION");
  const [bespokeTitle, setBespokeTitle] = useState("Bespoke Solitaire");
  const [bespokeSubtitle, setBespokeSubtitle] = useState("Crafted to your exact specifications. Begin building your legacy piece.");
  const [bespokeImage, setBespokeImage] = useState("");
  const [bespokeBasePrice, setBespokeBasePrice] = useState(3450);
  const [bespokeMetals, setBespokeMetals] = useState<any[]>([]);
  const [bespokeShapes, setBespokeShapes] = useState<string[]>([]);
  const [bespokeCaratMin, setBespokeCaratMin] = useState(0.5);
  const [bespokeCaratMax, setBespokeCaratMax] = useState(3.0);
  const [bespokeCaratDefault, setBespokeCaratDefault] = useState(1.5);
  const [bespokeEngravingMax, setBespokeEngravingMax] = useState(15);

  // New Features: Clarity, Color, Stone Types
  const [bespokeClarityOptions, setBespokeClarityOptions] = useState<any[]>([]);
  const [bespokeColorOptions, setBespokeColorOptions] = useState<any[]>([]);
  const [bespokeStoneTypes, setBespokeStoneTypes] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadCMSData = () => {
    setLoading(true);
    fetchDb()
      .then((res) => {
        if (res.features) {
          setBespokeEnabled(res.features.bespokeEnabled !== false);
        }
        if (res.bespoke_config) {
          setBespokeSlogan(res.bespoke_config.slogan || "THE SIGNATURE COLLECTION");
          setBespokeTitle(res.bespoke_config.title || "Bespoke Solitaire");
          setBespokeSubtitle(res.bespoke_config.subtitle || "");
          setBespokeImage(res.bespoke_config.previewImage || "");
          setBespokeBasePrice(res.bespoke_config.basePrice || 3450);
          setBespokeMetals(res.bespoke_config.metals || []);
          setBespokeShapes(res.bespoke_config.shapes || []);
          setBespokeCaratMin(res.bespoke_config.caratMin || 0.5);
          setBespokeCaratMax(res.bespoke_config.caratMax || 3.0);
          setBespokeCaratDefault(res.bespoke_config.caratDefault || 1.5);
          setBespokeEngravingMax(res.bespoke_config.engravingMax || 15);
          
          setBespokeClarityOptions(res.bespoke_config.clarityOptions || [
            { grade: "VVS1", multiplier: 1.3 },
            { grade: "VS1", multiplier: 1.1 },
            { grade: "SI1", multiplier: 0.9 },
          ]);
          setBespokeColorOptions(res.bespoke_config.colorOptions || [
            { color: "D", multiplier: 1.4 },
            { color: "F", multiplier: 1.2 },
            { color: "H", multiplier: 1.0 },
          ]);
          setBespokeStoneTypes(res.bespoke_config.stoneTypes || [
            { name: "Natural Diamond", multiplier: 1.5 },
            { name: "Lab-Grown Diamond", multiplier: 1.0 },
            { name: "Moissanite", multiplier: 0.6 },
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading bespoke configurator settings.");
      });
  };

  useEffect(() => {
    loadCMSData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      await updateCMS({
        features: {
          bespokeEnabled,
        },
        bespoke_config: {
          slogan: bespokeSlogan,
          title: bespokeTitle,
          subtitle: bespokeSubtitle,
          previewImage: bespokeImage,
          basePrice: Number(bespokeBasePrice),
          metals: bespokeMetals.map(m => ({
            name: m.name,
            color: m.color,
            priceMultiplier: Number(m.priceMultiplier) || 1.0
          })),
          shapes: bespokeShapes,
          caratMin: Number(bespokeCaratMin),
          caratMax: Number(bespokeCaratMax),
          caratDefault: Number(bespokeCaratDefault),
          engravingMax: Number(bespokeEngravingMax),
          clarityOptions: bespokeClarityOptions.map(c => ({
            grade: c.grade,
            multiplier: Number(c.multiplier) || 1.0
          })),
          colorOptions: bespokeColorOptions.map(c => ({
            color: c.color,
            multiplier: Number(c.multiplier) || 1.0
          })),
          stoneTypes: bespokeStoneTypes.map(s => ({
            name: s.name,
            multiplier: Number(s.multiplier) || 1.0
          }))
        },
      });
      showToast("Bespoke Configurator updated successfully.");
      loadCMSData();
    } catch (error) {
      console.error(error);
      showToast("Error updating Bespoke Configurator.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-soft-linen text-slate-grey font-label-caps text-xs tracking-widest">
        Loading Bespoke Configurator Editor...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-12 relative">
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-amber-600/40 to-deep-navy" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                Bespoke Atelier Configurator
              </h1>
              <p className="text-slate-grey font-body-md text-sm">
                Manage options, metals, shapes, pricing multipliers, and details for the Atelier Custom Commission page.
              </p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50"
            >
              {saveLoading ? "Saving..." : "Save Configurator"}
            </button>
          </div>

          {/* Toggle Control */}
          <div className="flex items-center gap-3 p-4 bg-soft-linen/30 border border-slate-grey/15">
            <input
              type="checkbox"
              id="bespoke-enabled"
              checked={bespokeEnabled}
              onChange={(e) => setBespokeEnabled(e.target.checked)}
              className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
            />
            <label htmlFor="bespoke-enabled" className="font-body-md text-sm text-ink-black cursor-pointer font-semibold">
              Enable Bespoke Commission Services (Toggle Atelier Configurator Page ON/OFF)
            </label>
          </div>
        </div>

        {/* Branding & Pricing Section */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
            Branding &amp; Base Price
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Collection Slogan Tag
              </label>
              <input
                type="text"
                value={bespokeSlogan}
                onChange={(e) => setBespokeSlogan(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Page Title
              </label>
              <input
                type="text"
                value={bespokeTitle}
                onChange={(e) => setBespokeTitle(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
              Subtitle Narrative Copy
            </label>
            <textarea
              value={bespokeSubtitle}
              onChange={(e) => setBespokeSubtitle(e.target.value)}
              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Ring Preview Image URL
              </label>
              <input
                type="url"
                value={bespokeImage}
                onChange={(e) => setBespokeImage(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Base Estimate Price (₹)
              </label>
              <input
                type="number"
                value={bespokeBasePrice}
                onChange={(e) => setBespokeBasePrice(Number(e.target.value))}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                required
              />
            </div>
          </div>
        </section>

        {/* Metals Configuration */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
            <h3 className="font-headline-md text-lg text-deep-navy uppercase">
              Available Metals Configuration
            </h3>
            <button
              type="button"
              onClick={() => setBespokeMetals([...bespokeMetals, { name: "NEW METAL", color: "#CCCCCC", priceMultiplier: 1.0 }])}
              className="px-3 py-1 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer"
            >
              + Add Metal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bespokeMetals.map((m, idx) => (
              <div key={idx} className="border border-slate-grey/20 p-4 bg-soft-linen/20 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => setBespokeMetals(bespokeMetals.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 text-error text-[10px] font-label-caps cursor-pointer"
                >
                  Remove
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase">Metal Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...bespokeMetals];
                        next[idx].name = e.target.value;
                        setBespokeMetals(next);
                      }}
                      className="border-b border-slate-grey/30 py-1 text-xs outline-none font-body-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase">Price Multiplier</label>
                    <input
                      type="number"
                      step="0.05"
                      value={m.priceMultiplier !== undefined ? m.priceMultiplier : 1.0}
                      onChange={(e) => {
                        const next = [...bespokeMetals];
                        next[idx].priceMultiplier = Number(e.target.value) || 1.0;
                        setBespokeMetals(next);
                      }}
                      className="border-b border-slate-grey/30 py-1 text-xs outline-none font-body-md"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase">Color Hex</label>
                    <input
                      type="text"
                      value={m.color}
                      onChange={(e) => {
                        const next = [...bespokeMetals];
                        next[idx].color = e.target.value;
                        setBespokeMetals(next);
                      }}
                      className="border-b border-slate-grey/30 py-1 text-xs outline-none font-mono"
                    />
                  </div>
                  <input
                    type="color"
                    value={m.color.startsWith("#") ? m.color : "#CCCCCC"}
                    onChange={(e) => {
                      const next = [...bespokeMetals];
                      next[idx].color = e.target.value;
                      setBespokeMetals(next);
                    }}
                    className="w-8 h-8 rounded-full border cursor-pointer mt-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stone Shapes & Carat Options */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
            Stone Shapes &amp; Carat Controls
          </h3>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
              Diamond Shapes (Comma-separated)
            </label>
            <input
              type="text"
              value={bespokeShapes.join(", ")}
              onChange={(e) => setBespokeShapes(e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean))}
              className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
              placeholder="ROUND, OVAL, EMERALD, PEAR, CUSHION"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Min (ct)</label>
              <input
                type="number"
                step="0.1"
                value={bespokeCaratMin}
                onChange={(e) => setBespokeCaratMin(Number(e.target.value))}
                className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Max (ct)</label>
              <input
                type="number"
                step="0.1"
                value={bespokeCaratMax}
                onChange={(e) => setBespokeCaratMax(Number(e.target.value))}
                className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Default (ct)</label>
              <input
                type="number"
                step="0.1"
                value={bespokeCaratDefault}
                onChange={(e) => setBespokeCaratDefault(Number(e.target.value))}
                className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Engraving Max Chars</label>
              <input
                type="number"
                value={bespokeEngravingMax}
                onChange={(e) => setBespokeEngravingMax(Number(e.target.value))}
                className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
              />
            </div>
          </div>
        </section>

        {/* Pricing Adjusters: Stone Types, Color & Clarity Multipliers */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
            Atelier Diamond Multipliers &amp; Grades
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stone Types */}
            <div className="space-y-4 border-r border-slate-grey/15 pr-4">
              <div className="flex justify-between items-center">
                <h4 className="font-label-caps text-[10px] text-deep-navy uppercase tracking-wider font-bold">Stone Types</h4>
                <button type="button" onClick={() => setBespokeStoneTypes([...bespokeStoneTypes, { name: "New Stone", multiplier: 1.0 }])} className="text-[9px] text-deep-navy uppercase underline cursor-pointer">+ Add</button>
              </div>
              <div className="space-y-2">
                {bespokeStoneTypes.map((st, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={st.name} onChange={(e) => {
                      const next = [...bespokeStoneTypes];
                      next[i].name = e.target.value;
                      setBespokeStoneTypes(next);
                    }} className="w-1/2 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <input type="number" step="0.05" value={st.multiplier} onChange={(e) => {
                      const next = [...bespokeStoneTypes];
                      next[i].multiplier = Number(e.target.value) || 1.0;
                      setBespokeStoneTypes(next);
                    }} className="w-1/4 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <button type="button" onClick={() => setBespokeStoneTypes(bespokeStoneTypes.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clarity Grades */}
            <div className="space-y-4 border-r border-slate-grey/15 px-4">
              <div className="flex justify-between items-center">
                <h4 className="font-label-caps text-[10px] text-deep-navy uppercase tracking-wider font-bold">Clarity Options</h4>
                <button type="button" onClick={() => setBespokeClarityOptions([...bespokeClarityOptions, { grade: "GRADE", multiplier: 1.0 }])} className="text-[9px] text-deep-navy uppercase underline cursor-pointer">+ Add</button>
              </div>
              <div className="space-y-2">
                {bespokeClarityOptions.map((co, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={co.grade} onChange={(e) => {
                      const next = [...bespokeClarityOptions];
                      next[i].grade = e.target.value;
                      setBespokeClarityOptions(next);
                    }} className="w-1/2 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <input type="number" step="0.05" value={co.multiplier} onChange={(e) => {
                      const next = [...bespokeClarityOptions];
                      next[i].multiplier = Number(e.target.value) || 1.0;
                      setBespokeClarityOptions(next);
                    }} className="w-1/4 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <button type="button" onClick={() => setBespokeClarityOptions(bespokeClarityOptions.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Options */}
            <div className="space-y-4 pl-4">
              <div className="flex justify-between items-center">
                <h4 className="font-label-caps text-[10px] text-deep-navy uppercase tracking-wider font-bold">Color Grades</h4>
                <button type="button" onClick={() => setBespokeColorOptions([...bespokeColorOptions, { color: "COLOR", multiplier: 1.0 }])} className="text-[9px] text-deep-navy uppercase underline cursor-pointer">+ Add</button>
              </div>
              <div className="space-y-2">
                {bespokeColorOptions.map((col, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={col.color} onChange={(e) => {
                      const next = [...bespokeColorOptions];
                      next[i].color = e.target.value;
                      setBespokeColorOptions(next);
                    }} className="w-1/2 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <input type="number" step="0.05" value={col.multiplier} onChange={(e) => {
                      const next = [...bespokeColorOptions];
                      next[i].multiplier = Number(e.target.value) || 1.0;
                      setBespokeColorOptions(next);
                    }} className="w-1/4 border-b border-slate-grey/20 text-xs py-1 outline-none" />
                    <button type="button" onClick={() => setBespokeColorOptions(bespokeColorOptions.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
