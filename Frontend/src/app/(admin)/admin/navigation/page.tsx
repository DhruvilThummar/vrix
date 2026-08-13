"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS, fetchProducts, fetchCollections } from "@/utils/api";

// Preset standard pages
const STANDARD_PAGES = [
  { label: "Home Page", path: "/" },
  { label: "All Products", path: "/products" },
  { label: "Collections Catalog", path: "/collections" },
  { label: "Bespoke Configurator", path: "/bespoke" },
  { label: "Our Story", path: "/story" },
  { label: "Journal", path: "/journal" },
  { label: "VRIX+ Club", path: "/vrix-plus" },
  { label: "Search Catalog", path: "/search" },
  { label: "New Arrivals / Trending", path: "/collections/silent-center" },
];

const DEFAULT_NAV_LINKS = [
  { label: "Collections", path: "/collections" },
  { label: "All Products", path: "/products" },
  { label: "The World of VRIX", path: "/story" },
  { label: "Journal", path: "/journal" },
  { label: "Gifts", path: "/search" },
  { label: "Bespoke", path: "/bespoke" },
  { label: "New Arrivals", path: "/collections/silent-center" },
  { label: "VRIX+", path: "/vrix-plus" }
];

const PathSelector = ({
  value,
  onChange,
  allProducts = [],
  allCollections = []
}: {
  value: string;
  onChange: (val: string) => void;
  allProducts?: any[];
  allCollections?: any[];
}) => {
  const valStr = value ?? "";

  const getAutoType = (v: string) => {
    if (v.startsWith("/product/")) return "product";
    if (v.startsWith("/collections/") && v !== "/collections") return "collection";
    if (v === "/" || STANDARD_PAGES.some(p => p.path === v)) return "page";
    return "custom";
  };

  const [mode, setMode] = useState<string>(() => getAutoType(valStr));

  useEffect(() => {
    const auto = getAutoType(valStr);
    if (auto !== "custom" || mode !== "custom") {
      setMode(auto);
    }
  }, [valStr]);

  let selectedIdOrSlug = valStr;
  if (mode === "product") {
    selectedIdOrSlug = valStr.startsWith("/product/") ? valStr.replace("/product/", "") : (allProducts[0]?.id || "");
  } else if (mode === "collection") {
    selectedIdOrSlug = valStr.startsWith("/collections/") ? valStr.replace("/collections/", "") : (allCollections[0]?.id || allCollections[0]?.slug || "all");
  }

  const handleTypeChange = (newType: string) => {
    setMode(newType);
    if (newType === "page") {
      onChange("/");
    } else if (newType === "product") {
      const firstProd = allProducts[0]?.id || "";
      onChange(firstProd ? `/product/${firstProd}` : "/product/");
    } else if (newType === "collection") {
      const firstColl = allCollections[0]?.id || allCollections[0]?.slug || "all";
      onChange(`/collections/${firstColl}`);
    } else if (newType === "custom") {
      const isStandard = valStr === "/" || STANDARD_PAGES.some(p => p.path === valStr) || valStr.startsWith("/product/") || valStr.startsWith("/collections/");
      const defaultCustom = isStandard ? "/custom-link" : (valStr || "/custom-link");
      onChange(defaultCustom);
    }
  };

  const handleSelectionChange = (newVal: string) => {
    if (mode === "product") {
      onChange(`/product/${newVal}`);
    } else if (mode === "collection") {
      onChange(`/collections/${newVal}`);
    } else {
      onChange(newVal);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 mt-1 w-full max-w-full overflow-hidden">
      <select
        value={mode}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="border border-slate-grey/30 bg-pure-white text-xs px-2.5 py-1.5 outline-none font-semibold text-deep-navy cursor-pointer shrink-0 max-w-full truncate rounded"
      >
        <option value="page">Standard Page</option>
        <option value="collection">Collection Page</option>
        <option value="product">Individual Product</option>
        <option value="custom">Custom Web Link</option>
      </select>

      {mode === "page" && (
        <select
          value={selectedIdOrSlug}
          onChange={(e) => handleSelectionChange(e.target.value)}
          className="border border-slate-grey/30 bg-pure-white text-xs px-2.5 py-1.5 outline-none text-slate-grey flex-1 min-w-0 max-w-full truncate cursor-pointer font-medium rounded"
        >
          {STANDARD_PAGES.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
            </option>
          ))}
        </select>
      )}

      {mode === "collection" && (
        <select
          value={selectedIdOrSlug}
          onChange={(e) => handleSelectionChange(e.target.value)}
          className="border border-slate-grey/30 bg-pure-white text-xs px-2.5 py-1.5 outline-none text-slate-grey flex-1 min-w-0 max-w-full truncate cursor-pointer font-medium rounded"
        >
          {allCollections.length > 0 ? (
            allCollections.map((c: any) => (
              <option key={c.id || c.slug} value={c.id || c.slug}>
                {c.name || c.title || c.slug}
              </option>
            ))
          ) : (
            <option value="all">All Jewelry</option>
          )}
        </select>
      )}

      {mode === "product" && (
        <select
          value={selectedIdOrSlug}
          onChange={(e) => handleSelectionChange(e.target.value)}
          className="border border-slate-grey/30 bg-pure-white text-xs px-2.5 py-1.5 outline-none text-slate-grey flex-1 min-w-0 max-w-full truncate cursor-pointer font-medium rounded"
        >
          {allProducts.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      {mode === "custom" && (
        <input
          type="text"
          value={selectedIdOrSlug}
          onChange={(e) => onChange(e.target.value)}
          className="border border-slate-grey/30 px-3 py-1.5 text-xs outline-none text-ink-black flex-1 min-w-0 max-w-full rounded"
          placeholder="e.g. /custom-url or https://..."
        />
      )}
    </div>
  );
};

export default function AdminNavigationPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Database configurations
  const [navLinks, setNavLinks] = useState<any[]>([]);
  const [homepageCategories, setHomepageCategories] = useState<any[]>([]);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);

  // Dynamic products and collections list for selectors
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCollections, setAllCollections] = useState<any[]>([]);

  // Preview interactive state
  const [hoveredPreviewIndex, setHoveredPreviewIndex] = useState<number | null>(null);
  const [previewTheme, setPreviewTheme] = useState<"solid" | "transparent">("solid");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadCMSData = () => {
    setLoading(true);
    Promise.all([fetchDb(), fetchProducts(), fetchCollections()])
      .then(([dbRes, prodRes, collRes]) => {
        if (Array.isArray(dbRes.navigation)) {
          setNavLinks(dbRes.navigation);
        } else {
          setNavLinks(DEFAULT_NAV_LINKS);
        }
        if (dbRes.homepage && Array.isArray(dbRes.homepage.categories)) {
          setHomepageCategories(dbRes.homepage.categories);
        }
        setAllProducts(prodRes || []);
        setAllCollections(collRes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading configurations.");
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
      showToast("Error saving changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Restore Default VRIX Links helper
  const handleRestoreDefaults = () => {
    if (window.confirm("Are you sure you want to restore the default VRIX navigation links? This will replace your current links.")) {
      setNavLinks(DEFAULT_NAV_LINKS);
      setSelectedLinkIndex(null);
      showToast("Restored default header links stack.");
    }
  };

  // Helper to add top-level link
  const addTopLevelLink = () => {
    setNavLinks([...navLinks, { label: "NEW LINK", path: "/" }]);
    setSelectedLinkIndex(navLinks.length);
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

  // Up / Down order triggers
  const moveLinkUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...navLinks];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    setNavLinks(next);
    if (selectedLinkIndex === idx) setSelectedLinkIndex(idx - 1);
    else if (selectedLinkIndex === idx - 1) setSelectedLinkIndex(idx);
  };

  const moveLinkDown = (idx: number) => {
    if (idx === navLinks.length - 1) return;
    const next = [...navLinks];
    const temp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = temp;
    setNavLinks(next);
    if (selectedLinkIndex === idx) setSelectedLinkIndex(idx + 1);
    else if (selectedLinkIndex === idx + 1) setSelectedLinkIndex(idx);
  };

  // Mega-menu category helpers
  const addMegaCategory = (linkIdx: number) => {
    const next = [...navLinks];
    const item = next[linkIdx];
    if (!item.megaMenu) {
      item.megaMenu = { categories: [], featured: { title: "", image: "", link: "" } };
    }
    if (!item.megaMenu.categories) {
      item.megaMenu.categories = [];
    }
    item.megaMenu.categories.push({ title: "NEW COLUMN", links: [] });
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
      <div className="w-full h-screen bg-soft-linen/30 flex items-center justify-center gap-3 font-label-caps text-xs text-slate-grey uppercase tracking-widest">
        <div className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
        Initializing visual builder...
      </div>
    );
  }

  // Get currently active preview mega menu
  const previewIndex = hoveredPreviewIndex !== null ? hoveredPreviewIndex : selectedLinkIndex;
  const activePreviewLink = previewIndex !== null ? navLinks[previewIndex] : null;

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 p-6 md:p-12 relative font-body-md text-ink-black">
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in rounded">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Banner Section */}
        <div className="bg-pure-white border border-slate-grey/25 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden rounded">
          <div className="absolute top-0 left-0 right-0 h-1 bg-deep-navy" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">
                Shop Menu &amp; Categories Designer
              </h1>
              <p className="text-slate-grey font-body-md text-xs">
                Rearrange links, design mega-menus, and select pages with absolutely zero coding knowledge.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-all font-label-caps text-xs tracking-wider uppercase cursor-pointer bg-transparent rounded"
              >
                Restore VRIX Defaults
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-all font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50 shadow-md rounded"
              >
                {saveLoading ? "Saving Changes..." : "Publish Navigation"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Interactive Navigation Preview */}
        <section className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm space-y-4 rounded relative z-40">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
            <div>
              <h3 className="font-label-caps text-xs text-deep-navy font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Live Navbar Interactive Preview
              </h3>
              <p className="text-[10px] text-slate-grey mt-0.5">Click or hover over the mock navigation bar below to preview dropdowns and mega-menus.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTheme("solid")}
                className={`px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-wider border rounded cursor-pointer transition-all ${previewTheme === "solid"
                    ? "bg-deep-navy text-pure-white border-deep-navy"
                    : "border-slate-grey/20 text-slate-grey hover:border-deep-navy/45 bg-pure-white"
                  }`}
              >
                Solid Header Mode
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme("transparent")}
                className={`px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-wider border rounded cursor-pointer transition-all ${previewTheme === "transparent"
                    ? "bg-deep-navy text-pure-white border-deep-navy"
                    : "border-slate-grey/20 text-slate-grey hover:border-deep-navy/45 bg-pure-white"
                  }`}
              >
                Transparent Header Mode
              </button>
            </div>
          </div>

          {/* Mini-Navbar Mock Shell */}
          <div
            className={`border rounded shadow-inner overflow-visible relative z-40 min-h-[140px] flex flex-col justify-between transition-all duration-500 ${previewTheme === "transparent"
                ? "bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000')] bg-cover bg-center border-transparent"
                : "border-slate-grey/15 bg-pure-white"
              }`}
          >
            {/* Overlay background dim filter for transparent view */}
            {previewTheme === "transparent" && (
              <div className="absolute inset-0 bg-ink-black/25 z-0 rounded pointer-events-none" />
            )}

            {/* Top row - Brand Logo, Icons */}
            <div className={`grid grid-cols-3 items-center px-6 py-3 z-10 border-b ${previewTheme === "transparent" ? "border-pure-white/15 text-pure-white" : "border-slate-grey/10 text-ink-black"
              }`}>
              {/* Left Column (Spacer) */}
              <div className={`text-[10px] font-label-caps uppercase tracking-widest ${previewTheme === "transparent" ? "text-pure-white/80" : "text-slate-grey"
                }`}>
                VRIX Luxury Fine Jewelry
              </div>

              {/* Center Column (Brand Logo) */}
              <div className="flex justify-center">
                <span className={`font-display-lg text-2xl font-light tracking-[0.25em] uppercase select-none ${previewTheme === "transparent" ? "text-pure-white" : "text-ink-black"
                  }`}>
                  VRIX
                </span>
              </div>

              {/* Right Column (Mock Action Icons) */}
              <div className={`flex justify-end items-center gap-5 text-sm ${previewTheme === "transparent" ? "text-pure-white" : "text-slate-grey"
                }`}>
                <select
                  disabled
                  className={`bg-transparent text-xs font-semibold uppercase tracking-wider border-none outline-none mr-2 opacity-70 cursor-not-allowed ${previewTheme === "transparent" ? "text-pure-white" : "text-ink-black"
                    }`}
                >
                  <option style={{ color: "#000" }}>INR (₹) </option>
                </select>
                <span className="material-symbols-outlined text-lg">search</span>
                <span className="material-symbols-outlined text-lg font-light">favorite</span>
                <span className="material-symbols-outlined text-lg">shopping_bag</span>
              </div>
            </div>

            {/* Bottom Row - Centered Navigation links */}
            <div className={`flex justify-center gap-8 py-3 select-none z-10 ${previewTheme === "transparent" ? "bg-transparent text-pure-white/95" : "bg-pure-white text-ink-black"
              }`}>
              {navLinks.map((link, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setHoveredPreviewIndex(idx)}
                  onMouseLeave={() => setHoveredPreviewIndex(null)}
                  onClick={() => setSelectedLinkIndex(idx)}
                  className={`font-label-caps text-[11px] tracking-[0.15em] uppercase pb-1 border-b-2 transition-all cursor-pointer ${selectedLinkIndex === idx
                      ? `${previewTheme === "transparent" ? "border-pure-white text-pure-white font-bold" : "border-deep-navy text-deep-navy font-bold"}`
                      : `${previewTheme === "transparent" ? "border-transparent text-pure-white/75 hover:text-pure-white hover:border-pure-white/30" : "border-transparent text-slate-grey hover:text-deep-navy hover:border-slate-grey/30"}`
                    }`}
                >
                  {link.label || "Unnamed Link"}
                </button>
              ))}
            </div>

            {/* Simulated Mega-Menu Dropdown */}
            {activePreviewLink && activePreviewLink.megaMenu && (
              <div
                className="relative w-full bg-pure-white/95 backdrop-blur-md border-b border-slate-grey/25 shadow-sm p-8 z-50 transition-all duration-300 animate-fade-in flex justify-between rounded-b"
                onMouseEnter={() => {
                  if (hoveredPreviewIndex === null && selectedLinkIndex !== null) {
                    setHoveredPreviewIndex(selectedLinkIndex);
                  }
                }}
                onMouseLeave={() => setHoveredPreviewIndex(null)}
              >
                <div className="flex-1 grid grid-cols-3 gap-8">
                  {activePreviewLink.megaMenu.categories && activePreviewLink.megaMenu.categories.length > 0 ? (
                    activePreviewLink.megaMenu.categories.map((cat: any, cIdx: number) => (
                      <div key={cIdx} className="space-y-3">
                        <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-wider border-b border-slate-grey/10 pb-1.5">
                          {cat.title || "Column Header"}
                        </h4>
                        <ul className="space-y-2">
                          {cat.links && cat.links.length > 0 ? (
                            cat.links.map((lnk: any, lIdx: number) => (
                              <li key={lIdx}>
                                <a
                                  href="#"
                                  onClick={(e) => e.preventDefault()}
                                  className="text-xs text-slate-grey hover:text-deep-navy transition-colors block"
                                >
                                  {lnk.label || "Sublink Label"}
                                </a>
                              </li>
                            ))
                          ) : (
                            <li className="text-[10px] text-slate-grey/60 italic">No sublinks yet</li>
                          )}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-slate-grey/60 italic">
                      This link has a mega menu container but no columns added yet.
                    </div>
                  )}
                </div>

                {/* Featured Promo Panel inside Mega Menu */}
                {activePreviewLink.megaMenu.featured && (
                  <div className="w-64 border-l border-slate-grey/10 pl-8 flex flex-col justify-between">
                    <div>
                      <h4 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest mb-2.5">Featured Showcase</h4>
                      {activePreviewLink.megaMenu.featured.image ? (
                        <div className="w-full h-32 relative bg-soft-linen/50 overflow-hidden border border-slate-grey/15 rounded">
                          <img
                            alt="Featured Promo"
                            src={activePreviewLink.megaMenu.featured.image}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center border border-dashed border-slate-grey/30 bg-soft-linen/20 rounded text-[10px] text-slate-grey italic">
                          No promotional image set
                        </div>
                      )}
                      <h5 className="font-headline-md text-xs font-semibold text-deep-navy mt-3">
                        {activePreviewLink.megaMenu.featured.title || "Promotional Banner"}
                      </h5>
                    </div>
                    <span className="text-[10px] text-deep-navy uppercase tracking-wider font-semibold border-b border-deep-navy w-fit mt-2">
                      Shop Now →
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Builder Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Header Links Management Panel (Left) */}
          <section className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm space-y-6 lg:col-span-1 rounded">
            <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
              <div>
                <h3 className="font-label-caps text-xs text-deep-navy font-bold tracking-wider uppercase">
                  Navbar Main Tabs
                </h3>
                <p className="text-[9px] text-slate-grey">Top level tabs seen on site</p>
              </div>
              <button
                type="button"
                onClick={addTopLevelLink}
                className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer hover:bg-ink-black transition-colors rounded shadow-xs"
              >
                + Add Tab
              </button>
            </div>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {navLinks.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLinkIndex(idx)}
                  className={`p-4 border transition-all cursor-pointer flex flex-col gap-3 relative rounded ${selectedLinkIndex === idx
                      ? "border-deep-navy bg-soft-linen/10 shadow-sm ring-1 ring-deep-navy/30"
                      : "border-slate-grey/15 bg-surface/30 hover:border-slate-grey/30"
                    }`}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); moveLinkUp(idx); }}
                      className="text-slate-grey hover:text-deep-navy text-xs font-bold disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === navLinks.length - 1}
                      onClick={(e) => { e.stopPropagation(); moveLinkDown(idx); }}
                      className="text-slate-grey hover:text-deep-navy text-xs font-bold disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTopLevelLink(idx);
                      }}
                      className="text-red-500 hover:text-red-700 text-[10px] font-label-caps cursor-pointer hover:underline ml-2"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 pr-24">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider font-semibold">Tab Name</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateTopLevelLink(idx, "label", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-b border-slate-grey/20 py-1 text-xs outline-none font-bold text-deep-navy focus:border-deep-navy bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider font-semibold">Points to Page</label>
                    <div onClick={(e) => e.stopPropagation()}>
                      <PathSelector allProducts={allProducts} allCollections={allCollections}
                        value={link.path}
                        onChange={(val) => updateTopLevelLink(idx, "path", val)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 border-t border-slate-grey/10 pt-2">
                    <span className="material-symbols-outlined text-xs text-deep-navy">info</span>
                    <span className="text-[9px] text-slate-grey">
                      {link.megaMenu ? "Dropdown enabled — click to configure columns" : "Direct tab (no dropdown)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mega Menu Structures Panel (Right/Center) */}
          <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 lg:col-span-2 rounded">
            <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">menu_open</span>
              Visual Dropdown Menu Column Designer
            </h3>

            {selectedLinkIndex === null ? (
              <div className="h-64 flex flex-col gap-2 items-center justify-center border-2 border-dashed border-slate-grey/30 text-slate-grey font-label-caps text-xs tracking-wider rounded bg-soft-linen/5">
                <span className="material-symbols-outlined text-lg">touch_app</span>
                Click a Tab from the left panel to configure its Dropdown columns
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Active Link Configuration Info */}
                <div className="p-4 bg-soft-linen/10 border border-slate-grey/10 flex justify-between items-center rounded">
                  <div>
                    <h4 className="font-headline-md text-sm text-deep-navy font-semibold">
                      Dropdown Settings: {navLinks[selectedLinkIndex].label}
                    </h4>
                    <p className="text-[10px] text-slate-grey mt-0.5">Add, change, or remove columns of links for this tab's dropdown.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMegaCategory(selectedLinkIndex)}
                    className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black transition-colors rounded"
                  >
                    + Add Link Column
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mega-menu categories columns */}
                  <div className="space-y-6 md:border-r md:border-slate-grey/15 md:pr-6">
                    <h5 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">view_column</span>
                      Link Columns list
                    </h5>

                    {(!navLinks[selectedLinkIndex].megaMenu ||
                      !navLinks[selectedLinkIndex].megaMenu.categories ||
                      navLinks[selectedLinkIndex].megaMenu.categories.length === 0) ? (
                      <div className="text-slate-grey text-xs py-8 text-center border border-dashed border-slate-grey/20 rounded bg-soft-linen/5 space-y-1">
                        <p className="font-semibold text-deep-navy">No Dropdown Columns</p>
                        <p className="text-[10px]">This tab points directly to its page. Click "+ Add Link Column" to enable a dropdown.</p>
                      </div>
                    ) : (
                      navLinks[selectedLinkIndex].megaMenu.categories.map((cat: any, catIdx: number) => (
                        <div key={catIdx} className="border border-slate-grey/25 p-4 bg-soft-linen/5 space-y-4 relative rounded">
                          <button
                            type="button"
                            onClick={() => removeMegaCategory(selectedLinkIndex, catIdx)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-[10px] font-label-caps cursor-pointer"
                          >
                            Delete Column
                          </button>

                          <div className="flex flex-col gap-1 pr-24">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Column Title</label>
                            <input
                              type="text"
                              value={cat.title}
                              onChange={(e) => updateMegaCategoryTitle(selectedLinkIndex, catIdx, e.target.value)}
                              className="border-b border-slate-grey/30 py-1 text-xs outline-none font-bold text-deep-navy focus:border-deep-navy bg-transparent"
                            />
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center border-t border-slate-grey/10 pt-3">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider font-semibold">Column Items</label>
                              <button
                                type="button"
                                onClick={() => addMegaLink(selectedLinkIndex, catIdx)}
                                className="text-deep-navy text-[10px] font-label-caps hover:underline flex items-center gap-0.5"
                              >
                                + Add Link Item
                              </button>
                            </div>

                            {cat.links && cat.links.map((lnk: any, lnkIdx: number) => (
                              <div key={lnkIdx} className="flex flex-col gap-2 bg-pure-white p-3 border border-slate-grey/15 rounded shadow-2xs">
                                <div className="flex justify-between items-center">
                                  <input
                                    type="text"
                                    value={lnk.label}
                                    onChange={(e) => updateMegaLink(selectedLinkIndex, catIdx, lnkIdx, "label", e.target.value)}
                                    placeholder="Sublink label"
                                    className="text-xs border-b border-transparent focus:border-deep-navy outline-none py-0.5 font-semibold text-deep-navy flex-1 mr-4"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeMegaLink(selectedLinkIndex, catIdx, lnkIdx)}
                                    className="text-red-500 hover:text-red-700 text-xs p-1"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <PathSelector allProducts={allProducts} allCollections={allCollections}
                                  value={lnk.path}
                                  onChange={(val) => updateMegaLink(selectedLinkIndex, catIdx, lnkIdx, "path", val)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Mega-menu featured promotion card */}
                  <div className="space-y-4">
                    <h5 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">campaign</span>
                      Featured Dropdown Banner Card
                    </h5>
                    <div className="border border-slate-grey/25 p-4 bg-soft-linen/5 space-y-4 rounded">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Promo Image Title</label>
                        <input
                          type="text"
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.title || ""}
                          onChange={(e) => updateFeaturedMega(selectedLinkIndex, "title", e.target.value)}
                          placeholder="e.g. New Arrivals"
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none focus:border-deep-navy font-semibold bg-transparent"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Promo Image URL</label>
                        <input
                          type="text"
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.image || ""}
                          onChange={(e) => updateFeaturedMega(selectedLinkIndex, "image", e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/..."
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none focus:border-deep-navy bg-transparent"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Link Destination</label>
                        <PathSelector allProducts={allProducts} allCollections={allCollections}
                          value={navLinks[selectedLinkIndex]?.megaMenu?.featured?.link || "/"}
                          onChange={(val) => updateFeaturedMega(selectedLinkIndex, "link", val)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Homepage Categories Grid Section */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
            <div>
              <h3 className="font-headline-md text-base text-deep-navy uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                Homepage "Shop by Category" Grid Configuration
              </h3>
              <p className="text-[10px] text-slate-grey mt-0.5">Customize the visual category cards displayed on the store homepage.</p>
            </div>
            <button
              type="button"
              onClick={addHomepageCategory}
              className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black transition-colors rounded shadow-xs"
            >
              + Add Category Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageCategories.map((cat, idx) => (
              <div key={idx} className="border border-slate-grey/20 p-4 bg-soft-linen/5 space-y-4 relative rounded">
                <button
                  type="button"
                  onClick={() => removeHomepageCategory(idx)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-[10px] font-label-caps cursor-pointer"
                >
                  Remove Card
                </button>

                {/* Micro Image Thumbnail */}
                <div className="flex items-center gap-3 border-b border-slate-grey/10 pb-3">
                  <div className="w-12 h-12 relative overflow-hidden bg-soft-linen border border-slate-grey/15 rounded flex-shrink-0">
                    <img
                      alt={cat.title || "Category Preview"}
                      src={cat.image}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100";
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Category Title</label>
                    <input
                      type="text"
                      value={cat.title}
                      onChange={(e) => updateHomepageCategory(idx, "title", e.target.value)}
                      className="border-b border-slate-grey/30 py-0.5 text-xs outline-none font-bold text-deep-navy focus:border-deep-navy bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Image URL</label>
                  <input
                    type="text"
                    value={cat.image}
                    onChange={(e) => updateHomepageCategory(idx, "image", e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none focus:border-deep-navy text-slate-grey bg-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Link Destination</label>
                  <PathSelector allProducts={allProducts} allCollections={allCollections}
                    value={cat.link}
                    onChange={(val) => updateHomepageCategory(idx, "link", val)}
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
