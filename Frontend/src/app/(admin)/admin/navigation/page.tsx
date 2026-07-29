"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS } from "@/utils/api";
import Image from "next/image";

export default function AdminNavigationPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States
  const [navLinks, setNavLinks] = useState<any[]>([]);
  const [homepageCategories, setHomepageCategories] = useState<any[]>([]);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);

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
        if (Array.isArray(res.navigation)) {
          setNavLinks(res.navigation);
        }
        if (res.homepage && Array.isArray(res.homepage.categories)) {
          setHomepageCategories(res.homepage.categories);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading navigation configurations.");
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
        navigation: navLinks,
        homepage: {
          categories: homepageCategories,
        },
      });
      showToast("Navigation and Categories updated successfully.");
      loadCMSData();
    } catch (error) {
      console.error(error);
      showToast("Error saving navigation.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper to add top-level link
  const addTopLevelLink = () => {
    setNavLinks([...navLinks, { label: "NEW LINK", path: "/" }]);
  };

  // Helper to remove top-level link
  const removeTopLevelLink = (idx: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== idx));
    if (selectedLinkIndex === idx) setSelectedLinkIndex(null);
  };

  // Helper to edit top-level link fields
  const updateTopLevelLink = (idx: number, key: string, val: any) => {
    const next = [...navLinks];
    next[idx] = { ...next[idx], [key]: val };
    setNavLinks(next);
  };

  // Mega-menu category helpers
  const addMegaCategory = (linkIdx: number) => {
    const next = [...navLinks];
    const item = next[linkIdx];
    if (!item.megaMenu) {
      item.megaMenu = { categories: [], featured: { title: "", image: "", link: "" } };
    }
    item.megaMenu.categories.push({ title: "NEW CATEGORY", links: [] });
    setNavLinks(next);
  };

  const removeMegaCategory = (linkIdx: number, catIdx: number) => {
    const next = [...navLinks];
    next[linkIdx].megaMenu.categories = next[linkIdx].megaMenu.categories.filter((_: any, i: number) => i !== catIdx);
    setNavLinks(next);
  };

  const updateMegaCategoryTitle = (linkIdx: number, catIdx: number, title: string) => {
    const next = [...navLinks];
    next[linkIdx].megaMenu.categories[catIdx].title = title;
    setNavLinks(next);
  };

  const addMegaLink = (linkIdx: number, catIdx: number) => {
    const next = [...navLinks];
    next[linkIdx].megaMenu.categories[catIdx].links.push({ label: "New Sublink", path: "/" });
    setNavLinks(next);
  };

  const removeMegaLink = (linkIdx: number, catIdx: number, linkIdx2: number) => {
    const next = [...navLinks];
    next[linkIdx].megaMenu.categories[catIdx].links = next[linkIdx].megaMenu.categories[catIdx].links.filter(
      (_: any, i: number) => i !== linkIdx2
    );
    setNavLinks(next);
  };

  const updateMegaLink = (linkIdx: number, catIdx: number, linkIdx2: number, key: string, val: string) => {
    const next = [...navLinks];
    next[linkIdx].megaMenu.categories[catIdx].links[linkIdx2][key] = val;
    setNavLinks(next);
  };

  // Featured Promo Item helper
  const updateFeaturedMega = (linkIdx: number, key: string, val: string) => {
    const next = [...navLinks];
    if (!next[linkIdx].megaMenu) {
      next[linkIdx].megaMenu = { categories: [], featured: { title: "", image: "", link: "" } };
    }
    next[linkIdx].megaMenu.featured = { ...next[linkIdx].megaMenu.featured, [key]: val };
    setNavLinks(next);
  };

  // Homepage Category Helpers
  const addHomepageCategory = () => {
    setHomepageCategories([...homepageCategories, { title: "New Category", image: "", link: "/" }]);
  };

  const updateHomepageCategory = (idx: number, key: string, val: string) => {
    const next = [...homepageCategories];
    next[idx] = { ...next[idx], [key]: val };
    setHomepageCategories(next);
  };

  const removeHomepageCategory = (idx: number) => {
    setHomepageCategories(homepageCategories.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-soft-linen text-slate-grey font-label-caps text-xs tracking-widest">
        Loading Navigation Editor...
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

      <form onSubmit={handleSave} className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-amber-600/40 to-deep-navy" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                Menu Navigation &amp; Homepage Categories
              </h1>
              <p className="text-slate-grey font-body-md text-sm">
                Redefine top-level links, glassmorphic mega-menu column paths, featured banner promotions, and homepage category grids.
              </p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50"
            >
              {saveLoading ? "Saving..." : "Save Navigation"}
            </button>
          </div>
        </div>

        {/* Part 1: Top Navigation Links Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm space-y-6 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
              <h3 className="font-label-caps text-xs text-deep-navy font-bold tracking-wider uppercase">
                Header Links
              </h3>
              <button
                type="button"
                onClick={addTopLevelLink}
                className="px-2.5 py-1 bg-deep-navy text-pure-white text-[9px] font-label-caps uppercase cursor-pointer hover:bg-ink-black"
              >
                + Add Link
              </button>
            </div>

            <div className="space-y-3">
              {navLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLinkIndex(idx)}
                  className={`p-3 border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    selectedLinkIndex === idx
                      ? "border-deep-navy bg-soft-linen/25 shadow-xs"
                      : "border-slate-grey/15 bg-surface/30 hover:border-slate-grey/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTopLevelLink(idx);
                    }}
                    className="absolute top-2 right-2 text-error text-[9px] font-label-caps cursor-pointer hover:underline"
                  >
                    Delete
                  </button>
                  <div className="flex flex-col gap-1 pr-12">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase">Link Label</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateTopLevelLink(idx, "label", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-b border-slate-grey/20 py-1 text-xs outline-none font-semibold text-deep-navy"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase">Link Path</label>
                    <input
                      type="text"
                      value={link.path}
                      onChange={(e) => updateTopLevelLink(idx, "path", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-b border-slate-grey/20 py-1 text-xs outline-none text-slate-grey"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Part 2: Mega Menu Nested Columns Configuration */}
          <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 lg:col-span-2">
            <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
              Mega Menu Structure Configurator
            </h3>

            {selectedLinkIndex === null ? (
              <div className="h-64 flex items-center justify-center border border-dashed border-slate-grey/30 text-slate-grey font-label-caps text-xs tracking-wider">
                Select a top-level link from the left panel to configure its Mega-Menu
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div className="p-4 bg-soft-linen/10 border border-slate-grey/10 flex justify-between items-center">
                  <div>
                    <h4 className="font-headline-md text-sm text-deep-navy font-semibold">
                      Editing: {navLinks[selectedLinkIndex].label}
                    </h4>
                    <p className="text-[10px] text-slate-grey mt-0.5">Configure sub-navigation columns and promotional featured content below.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMegaCategory(selectedLinkIndex)}
                    className="px-3 py-1 bg-deep-navy text-pure-white text-[9px] font-label-caps uppercase hover:bg-ink-black"
                  >
                    + Add Column
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mega-menu categories columns */}
                  <div className="space-y-6 md:border-r md:border-slate-grey/15 md:pr-6">
                    <h5 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase">
                      Sub-Category Columns
                    </h5>

                    {(!navLinks[selectedLinkIndex].megaMenu ||
                      !navLinks[selectedLinkIndex].megaMenu.categories ||
                      navLinks[selectedLinkIndex].megaMenu.categories.length === 0) ? (
                      <p className="text-slate-grey text-xs py-4">No columns configured. This link will behave as a standard link without a dropdown.</p>
                    ) : (
                      navLinks[selectedLinkIndex].megaMenu.categories.map((cat: any, catIdx: number) => (
                        <div key={catIdx} className="border border-slate-grey/25 p-4 bg-soft-linen/20 space-y-4 relative">
                          <button
                            type="button"
                            onClick={() => removeMegaCategory(selectedLinkIndex, catIdx)}
                            className="absolute top-2 right-2 text-error text-[9px] font-label-caps cursor-pointer"
                          >
                            Remove Column
                          </button>

                          <div className="flex flex-col gap-1 pr-20">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase">Column Header Title</label>
                            <input
                              type="text"
                              value={cat.title}
                              onChange={(e) => updateMegaCategoryTitle(selectedLinkIndex, catIdx, e.target.value)}
                              className="border-b border-slate-grey/30 py-1 text-xs outline-none font-bold"
                            />
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="font-label-caps text-[8px] text-slate-grey uppercase tracking-wider">Sublinks list</label>
                              <button
                                type="button"
                                onClick={() => addMegaLink(selectedLinkIndex, catIdx)}
                                className="text-deep-navy text-[9px] font-label-caps hover:underline"
                              >
                                + Add sublink
                              </button>
                            </div>

                            {cat.links.map((lnk: any, lnkIdx: number) => (
                              <div key={lnkIdx} className="flex gap-2 items-center bg-pure-white p-2 border border-slate-grey/10">
                                <input
                                  type="text"
                                  value={lnk.label}
                                  onChange={(e) => updateMegaLink(selectedLinkIndex, catIdx, lnkIdx, "label", e.target.value)}
                                  placeholder="Sublink label"
                                  className="flex-1 text-xs border-b border-transparent focus:border-deep-navy outline-none py-0.5"
                                />
                                <input
                                  type="text"
                                  value={lnk.path}
                                  onChange={(e) => updateMegaLink(selectedLinkIndex, catIdx, lnkIdx, "path", e.target.value)}
                                  placeholder="Sublink path"
                                  className="flex-1 text-xs border-b border-transparent focus:border-deep-navy outline-none py-0.5 text-slate-grey"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeMegaLink(selectedLinkIndex, catIdx, lnkIdx)}
                                  className="text-error text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Mega-menu featured promotion card */}
                  <div className="space-y-4">
                    <h5 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase">
                      Featured Promo Banner
                    </h5>
                    <div className="border border-slate-grey/25 p-4 bg-soft-linen/20 space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Promo Card Title</label>
                        <input
                          type="text"
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.title || ""}
                          onChange={(e) => updateFeaturedMega(selectedLinkIndex, "title", e.target.value)}
                          placeholder="e.g. The Spring Collection"
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Promo Image URL</label>
                        <input
                          type="text"
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.image || ""}
                          onChange={(e) => updateFeaturedMega(selectedLinkIndex, "image", e.target.value)}
                          placeholder="e.g. /images/promo.jpg"
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Promo Destination Link</label>
                        <input
                          type="text"
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.link || ""}
                          onChange={(e) => updateFeaturedMega(selectedLinkIndex, "link", e.target.value)}
                          placeholder="e.g. /collections/spring"
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Part 3: Homepage Categories Grid Section */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
            <h3 className="font-headline-md text-base text-deep-navy uppercase">
              Homepage "Shop by Category" Grid Configuration
            </h3>
            <button
              type="button"
              onClick={addHomepageCategory}
              className="px-3 py-1 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black cursor-pointer"
            >
              + Add Category Grid Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageCategories.map((cat, idx) => (
              <div key={idx} className="border border-slate-grey/20 p-4 bg-soft-linen/25 space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeHomepageCategory(idx)}
                  className="absolute top-2 right-2 text-error text-[10px] font-label-caps cursor-pointer"
                >
                  Remove
                </button>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Category Card Title</label>
                  <input
                    type="text"
                    value={cat.title}
                    onChange={(e) => updateHomepageCategory(idx, "title", e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none font-semibold text-deep-navy"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Grid Card Image URL</label>
                  <input
                    type="text"
                    value={cat.image}
                    onChange={(e) => updateHomepageCategory(idx, "image", e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none text-slate-grey"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Link Destination Path</label>
                  <input
                    type="text"
                    value={cat.link}
                    onChange={(e) => updateHomepageCategory(idx, "link", e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none text-slate-grey"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>
    </div>
  );
}
