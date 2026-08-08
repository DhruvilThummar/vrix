"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  fetchBespokeData,
  updateBespokeSettings,
  saveBespokeOption,
  deleteBespokeOption,
  saveBespokeVariant,
  deleteBespokeVariant,
} from "@/utils/api";

export default function AdminBespokePage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "options" | "variants" | "guide">("settings");

  // Settings State
  const [settings, setSettings] = useState({
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

  // Options State
  const [metals, setMetals] = useState<any[]>([]);
  const [silhouettes, setSilhouettes] = useState<any[]>([]);
  const [shapes, setShapes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // Form states for creating new Option
  const [newOptionCategory, setNewOptionCategory] = useState<"metal" | "silhouette" | "stone_shape">("metal");
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionColorHex, setNewOptionColorHex] = useState("#E6C762");
  const [newOptionImageUrl, setNewOptionImageUrl] = useState("");
  const [newOptionPriceMultiplier, setNewOptionPriceMultiplier] = useState("1.0");

  // Form states for mapping Variant
  const [varSilhouette, setVarSilhouette] = useState("");
  const [varMetal, setVarMetal] = useState("");
  const [varStoneShape, setVarStoneShape] = useState("");
  const [varImageUrl, setVarImageUrl] = useState("");
  const [varPriceModifier, setVarPriceModifier] = useState("1.0");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBespokeData();
      if (res.settings) {
        setSettings({
          headline: res.settings.headline || "Bespoke Atelier Estimate",
          slogan: res.settings.slogan || "THE SIGNATURE COLLECTION",
          subtitle: res.settings.subtitle || "",
          introParagraph: res.settings.introParagraph || "Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.",
          disclaimerText: res.settings.disclaimerText || "Final quote verified during 1-on-1 consultation with our lead master craftsman.",
          consultationCtaText: res.settings.consultationCtaText || "Book Atelier Consultation",
          craftingTimeline: res.settings.craftingTimeline || "3 – 4 Weeks",
          baseMinPrice: Number(res.settings.baseMinPrice || 65000),
          baseMaxPrice: Number(res.settings.baseMaxPrice || 180000),
          isEnabled: res.settings.isEnabled !== false,
        });
      }
      setMetals(res.metals || []);
      setSilhouettes(res.silhouettes || []);
      setShapes(res.shapes || []);
      setVariants(res.variants || []);

      if (res.silhouettes?.[0]) setVarSilhouette(res.silhouettes[0].code || res.silhouettes[0].name);
      if (res.metals?.[0]) setVarMetal(res.metals[0].code || res.metals[0].name);
      if (res.shapes?.[0]) setVarStoneShape(res.shapes[0].code || res.shapes[0].name);
    } catch (err: any) {
      console.error(err);
      showToast("Error loading bespoke data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await updateBespokeSettings(settings);
      showToast("Bespoke Atelier settings updated successfully!");
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Create or Update Option
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) {
      showToast("Please enter an option name.");
      return;
    }
    if (!newOptionImageUrl.trim()) {
      showToast("Strict Validation Error: High-resolution image URL is required!");
      return;
    }

    try {
      await saveBespokeOption({
        category: newOptionCategory,
        name: newOptionName.trim(),
        code: newOptionName.trim().toUpperCase().replace(/\s+/g, "_"),
        colorHex: newOptionCategory === "metal" ? newOptionColorHex : null,
        imageUrl: newOptionImageUrl.trim(),
        priceMultiplier: Number(newOptionPriceMultiplier) || 1.0,
      });
      showToast(`${newOptionName} option added successfully.`);
      setNewOptionName("");
      setNewOptionImageUrl("");
      loadData();
    } catch (err: any) {
      showToast(`Error adding option: ${err.message}`);
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm("Are you sure you want to delete this option?")) return;
    try {
      await deleteBespokeOption(id);
      showToast("Option deleted.");
      loadData();
    } catch (err: any) {
      showToast(`Error deleting option: ${err.message}`);
    }
  };

  // Add or Update Variant Mapping
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varSilhouette || !varMetal) {
      showToast("Silhouette and Metal selection are required.");
      return;
    }
    if (!varImageUrl.trim()) {
      showToast("Strict Validation Error: Variant Image URL is required so no option lacks visual representation.");
      return;
    }

    try {
      await saveBespokeVariant({
        silhouette: varSilhouette,
        metal: varMetal,
        stoneShape: varStoneShape || null,
        imageUrl: varImageUrl.trim(),
        priceModifier: Number(varPriceModifier) || 1.0,
      });
      showToast("Variant render mapping saved successfully!");
      setVarImageUrl("");
      loadData();
    } catch (err: any) {
      showToast(`Error saving variant: ${err.message}`);
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm("Remove this variant render mapping?")) return;
    try {
      await deleteBespokeVariant(id);
      showToast("Variant mapping deleted.");
      loadData();
    } catch (err: any) {
      showToast(`Error deleting variant: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-soft-linen text-slate-grey font-label-caps text-xs tracking-widest uppercase">
        Loading Bespoke Atelier Manager...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-amber-600/40 to-deep-navy" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-deep-navy">design_services</span>
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                  Bespoke Atelier CMS &amp; Variant Manager
                </h1>
              </div>
              <p className="text-slate-grey font-body-md text-sm mt-1">
                Manage hero copy, crafting lead times, base pricing ranges, attribute options, and variant render image mappings for `/bespoke`.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-label-caps text-xs text-deep-navy font-semibold bg-soft-linen/60 px-4 py-2 border border-slate-grey/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="w-4 h-4 accent-deep-navy"
                />
                Atelier Service Active
              </label>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar border-b border-slate-grey/15 pb-2">
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 font-label-caps text-xs uppercase transition-colors ${activeTab === "settings" ? "bg-deep-navy text-pure-white font-bold" : "bg-soft-linen/40 text-slate-grey hover:bg-soft-linen"}`}
            >
              1. Atelier Content &amp; Pricing
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`px-4 py-2 font-label-caps text-xs uppercase transition-colors ${activeTab === "options" ? "bg-deep-navy text-pure-white font-bold" : "bg-soft-linen/40 text-slate-grey hover:bg-soft-linen"}`}
            >
              2. Metals, Silhouettes &amp; Shapes ({metals.length + silhouettes.length + shapes.length})
            </button>
            <button
              onClick={() => setActiveTab("variants")}
              className={`px-4 py-2 font-label-caps text-xs uppercase transition-colors ${activeTab === "variants" ? "bg-deep-navy text-pure-white font-bold" : "bg-soft-linen/40 text-slate-grey hover:bg-soft-linen"}`}
            >
              3. Variant Image Render Matrix ({variants.length})
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`px-4 py-2 font-label-caps text-xs uppercase transition-colors ${activeTab === "guide" ? "bg-deep-navy text-pure-white font-bold" : "bg-soft-linen/40 text-slate-grey hover:bg-soft-linen"}`}
            >
              4. Live Site Impact Map 💡
            </button>
          </div>
        </div>

        {/* TAB 1: SETTINGS */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="bg-pure-white border border-slate-grey/20 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
              <h2 className="font-headline-md text-lg text-deep-navy uppercase">
                Atelier Copy &amp; Dynamic Pricing Formulas
              </h2>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors font-label-caps text-xs uppercase cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? "Saving..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Main Atelier Headline
                </label>
                <input
                  type="text"
                  value={settings.headline}
                  onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Slogan Tagline
                </label>
                <input
                  type="text"
                  value={settings.slogan}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                Intro Paragraph Copy (Shows on /bespoke &amp; Estimate Cards)
              </label>
              <textarea
                value={settings.introParagraph}
                onChange={(e) => setSettings({ ...settings, introParagraph: e.target.value })}
                className="border border-slate-grey/30 p-3 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                rows={2}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                Subtitle Narrative Copy
              </label>
              <textarea
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="border border-slate-grey/30 p-3 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Crafting Timeline
                </label>
                <input
                  type="text"
                  value={settings.craftingTimeline}
                  onChange={(e) => setSettings({ ...settings, craftingTimeline: e.target.value })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  placeholder="3 – 4 Weeks"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Min Estimated Range (₹)
                </label>
                <input
                  type="number"
                  value={settings.baseMinPrice}
                  onChange={(e) => setSettings({ ...settings, baseMinPrice: Number(e.target.value) })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Max Estimated Range (₹)
                </label>
                <input
                  type="number"
                  value={settings.baseMaxPrice}
                  onChange={(e) => setSettings({ ...settings, baseMaxPrice: Number(e.target.value) })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Disclaimer Note
                </label>
                <input
                  type="text"
                  value={settings.disclaimerText}
                  onChange={(e) => setSettings({ ...settings, disclaimerText: e.target.value })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Consultation Button Text
                </label>
                <input
                  type="text"
                  value={settings.consultationCtaText}
                  onChange={(e) => setSettings({ ...settings, consultationCtaText: e.target.value })}
                  className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                  required
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: OPTIONS MANAGER */}
        {activeTab === "options" && (
          <div className="space-y-8">
            {/* Add New Option Form */}
            <form onSubmit={handleAddOption} className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-3">
                Add New Attribute Option (Metals, Silhouettes, Stone Shapes)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Category</label>
                  <select
                    value={newOptionCategory}
                    onChange={(e: any) => setNewOptionCategory(e.target.value)}
                    className="border-b border-slate-grey/30 py-2 text-xs font-body-md focus:border-deep-navy outline-none"
                  >
                    <option value="metal">Metal &amp; Setting</option>
                    <option value="silhouette">Silhouette / Product Type</option>
                    <option value="stone_shape">Stone / Cut Shape</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Option Name</label>
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="e.g. 18K Rose Gold, Pendant Necklace"
                    className="border-b border-slate-grey/30 py-2 text-xs font-body-md focus:border-deep-navy outline-none"
                    required
                  />
                </div>

                {newOptionCategory === "metal" ? (
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Color Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newOptionColorHex}
                        onChange={(e) => setNewOptionColorHex(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 text-xs font-mono w-full outline-none"
                      />
                      <input
                        type="color"
                        value={newOptionColorHex}
                        onChange={(e) => setNewOptionColorHex(e.target.value)}
                        className="w-7 h-7 rounded-full border cursor-pointer flex-shrink-0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Price Multiplier</label>
                    <input
                      type="number"
                      step="0.05"
                      value={newOptionPriceMultiplier}
                      onChange={(e) => setNewOptionPriceMultiplier(e.target.value)}
                      className="border-b border-slate-grey/30 py-2 text-xs font-body-md outline-none"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold text-deep-navy">
                    Default Image URL * (Required)
                  </label>
                  <input
                    type="url"
                    value={newOptionImageUrl}
                    onChange={(e) => setNewOptionImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="border-b border-deep-navy/40 py-2 text-xs font-body-md outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-xs uppercase cursor-pointer"
              >
                + Add {newOptionCategory.toUpperCase()} Option
              </button>
            </form>

            {/* List Metals */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-4">
              <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                1. Metal Options ({metals.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {metals.map((m) => (
                  <div key={m.id} className="border border-slate-grey/20 p-4 bg-soft-linen/30 relative flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-black/20 shadow-inner flex-shrink-0" style={{ backgroundColor: m.colorHex || "#CCCCCC" }} />
                      <div>
                        <h4 className="font-label-caps text-xs font-bold text-deep-navy">{m.name}</h4>
                        <p className="text-[10px] text-slate-grey font-mono">{m.colorHex || "No Hex"}</p>
                      </div>
                    </div>
                    {m.imageUrl && (
                      <div className="w-full h-24 relative border border-slate-grey/15 overflow-hidden bg-pure-white">
                        <Image src={m.imageUrl} alt={m.name} fill className="object-contain p-1" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteOption(m.id)}
                      className="text-error text-[10px] font-label-caps uppercase text-left hover:underline"
                    >
                      Delete Metal
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* List Silhouettes */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-4">
              <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                2. Silhouettes / Product Types ({silhouettes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {silhouettes.map((s) => (
                  <div key={s.id} className="border border-slate-grey/20 p-4 bg-soft-linen/30 relative flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-label-caps text-xs font-bold text-deep-navy">{s.name}</h4>
                      <p className="text-[10px] text-slate-grey">Multiplier: {s.priceMultiplier}x</p>
                    </div>
                    {s.imageUrl && (
                      <div className="w-full h-24 relative border border-slate-grey/15 overflow-hidden bg-pure-white">
                        <Image src={s.imageUrl} alt={s.name} fill className="object-contain p-1" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteOption(s.id)}
                      className="text-error text-[10px] font-label-caps uppercase text-left hover:underline"
                    >
                      Delete Silhouette
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* List Shapes */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-4">
              <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                3. Stone Shapes / Cuts ({shapes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {shapes.map((sh) => (
                  <div key={sh.id} className="border border-slate-grey/20 p-4 bg-soft-linen/30 relative flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-label-caps text-xs font-bold text-deep-navy">{sh.name}</h4>
                      <p className="text-[10px] text-slate-grey">Multiplier: {sh.priceMultiplier}x</p>
                    </div>
                    <button
                      onClick={() => handleDeleteOption(sh.id)}
                      className="text-error text-[10px] font-label-caps uppercase text-left hover:underline"
                    >
                      Delete Shape
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VARIANT IMAGE MATRIX */}
        {activeTab === "variants" && (
          <div className="space-y-8">
            <form onSubmit={handleSaveVariant} className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-grey/15 pb-3">
                <h2 className="font-headline-md text-lg text-deep-navy uppercase">
                  Map High-Resolution Render Image to Specific Variant Combination
                </h2>
                <p className="text-xs text-slate-grey mt-1">
                  Assign exact high-resolution renders for specific combinations (e.g. Ring + 18K Rose Gold, Necklace + Platinum).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Silhouette</label>
                  <select
                    value={varSilhouette}
                    onChange={(e) => setVarSilhouette(e.target.value)}
                    className="border-b border-slate-grey/30 py-2 text-xs font-body-md focus:border-deep-navy outline-none"
                    required
                  >
                    {silhouettes.map((s) => (
                      <option key={s.id} value={s.code || s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Metal Choice</label>
                  <select
                    value={varMetal}
                    onChange={(e) => setVarMetal(e.target.value)}
                    className="border-b border-slate-grey/30 py-2 text-xs font-body-md focus:border-deep-navy outline-none"
                    required
                  >
                    {metals.map((m) => (
                      <option key={m.id} value={m.code || m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold">Stone Shape (Optional)</label>
                  <select
                    value={varStoneShape}
                    onChange={(e) => setVarStoneShape(e.target.value)}
                    className="border-b border-slate-grey/30 py-2 text-xs font-body-md focus:border-deep-navy outline-none"
                  >
                    <option value="">Any Shape</option>
                    {shapes.map((sh) => (
                      <option key={sh.id} value={sh.code || sh.name}>{sh.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase font-semibold text-deep-navy">
                    Variant Render Image URL *
                  </label>
                  <input
                    type="url"
                    value={varImageUrl}
                    onChange={(e) => setVarImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="border-b border-deep-navy/40 py-2 text-xs font-body-md outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-xs uppercase cursor-pointer"
              >
                + Map Variant Render Image
              </button>
            </form>

            {/* Matrix View */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-4">
              <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                Active Variant Mappings ({variants.length})
              </h3>

              {variants.length === 0 ? (
                <p className="text-xs text-slate-grey py-6 text-center italic">
                  No explicit variant mappings added yet. The system currently falls back to default category render images or luxury SVG placeholders.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {variants.map((v) => (
                    <div key={v.id} className="border border-slate-grey/20 p-4 bg-soft-linen/20 space-y-3 relative">
                      <div className="w-full h-36 relative border border-slate-grey/15 overflow-hidden bg-pure-white">
                        <Image src={v.imageUrl} alt={`${v.silhouette} - ${v.metal}`} fill className="object-contain p-2" />
                      </div>
                      <div>
                        <span className="font-label-caps text-[10px] uppercase text-slate-grey block">Combination</span>
                        <h4 className="font-label-caps text-xs font-bold text-deep-navy uppercase">
                          {v.silhouette} • {v.metal}
                        </h4>
                        {v.stoneShape && <span className="text-[10px] text-slate-grey font-body-md block">{v.stoneShape} Cut</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteVariant(v.id)}
                        className="text-error text-[10px] font-label-caps uppercase hover:underline"
                      >
                        Delete Mapping
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE SITE IMPACT MAP */}
        {activeTab === "guide" && (
          <div className="bg-pure-white border border-slate-grey/20 p-8 shadow-sm space-y-6">
            <h2 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-3">
              💡 Live Site Impact &amp; Admin Panel Guidance Map
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-grey/20 p-6 bg-soft-linen/30 space-y-3">
                <span className="material-symbols-outlined text-deep-navy text-2xl">web</span>
                <h3 className="font-label-caps text-xs font-bold text-deep-navy uppercase">1. Frontend Page (`/bespoke`)</h3>
                <ul className="text-xs text-slate-grey space-y-2 font-body-md list-disc pl-4">
                  <li><strong>Hero Copy:</strong> Main headline, slogan tagline, intro paragraph, and subtitle populate dynamically from Tab 1.</li>
                  <li><strong>Metal Renders:</strong> Selecting Rose Gold, Yellow Gold, or Platinum immediately resolves the assigned image from Tab 3 or default render from Tab 2.</li>
                  <li><strong>Price Calculator:</strong> Live estimation (`₹65,000 – ₹1,80,000`) calculates dynamically based on base min/max range, carat slider, and option multipliers.</li>
                  <li><strong>Crafting Time:</strong> Timeline pill displays exact string (e.g. `3 – 4 Weeks`).</li>
                </ul>
              </div>

              <div className="border border-slate-grey/20 p-6 bg-soft-linen/30 space-y-3">
                <span className="material-symbols-outlined text-deep-navy text-2xl">chat</span>
                <h3 className="font-label-caps text-xs font-bold text-deep-navy uppercase">2. VRIX AI Chatbot (`BespokeEstimateCard`)</h3>
                <ul className="text-xs text-slate-grey space-y-2 font-body-md list-disc pl-4">
                  <li><strong>Atelier Estimate Card:</strong> Populates intro disclaimer ("Final quote verified during 1-on-1 consultation...").</li>
                  <li><strong>Lead Time:</strong> Displays exact crafting timeline configured in Tab 1.</li>
                  <li><strong>Consultation Link:</strong> Directs customers directly to `/bespoke` with preselected custom piece parameters.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
