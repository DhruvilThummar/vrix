"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS, fetchProducts, fetchCollections } from "@/utils/api";

export default function AdminHomepageLayoutPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Dynamic Assets ---
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCollections, setAllCollections] = useState<any[]>([]);

  // --- Layout Selection Lists State ---
  const [featuredCollections, setFeaturedCollections] = useState<string[]>([]);
  const [newArrivals, setNewArrivals] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);

  // --- Temporary Local Fallbacks ---
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [homepageTagline, setHomepageTagline] = useState("");
  const [philosophyTitle, setPhilosophyTitle] = useState("");
  const [philosophyCards, setPhilosophyCards] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchDb(), fetchProducts(), fetchCollections()])
      .then(([res, prodRes, collRes]) => {
        setAllProducts(prodRes || []);
        setAllCollections(collRes || []);

        if (res.homepage) {
          setFeaturedCollections(res.homepage.featuredCollections || []);
          setNewArrivals(res.homepage.newArrivals || []);
          setFeaturedProducts(res.homepage.featuredProducts || []);

          // Keep copy fields to prevent overwriting
          setHeroTitle(res.homepage.heroTitle || "");
          setHeroSubtitle(res.homepage.heroSubtitle || "");
          setHeroImage(res.homepage.heroImage || "");
          setHomepageTagline(res.homepage.tagline || "");
          setPhilosophyTitle(res.homepage.philosophyTitle || "");
          setPhilosophyCards(res.homepage.philosophy || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading homepage layout settings.");
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      await updateCMS({
        homepage: {
          heroTitle,
          heroSubtitle,
          heroImage,
          tagline: homepageTagline,
          philosophyTitle,
          philosophy: philosophyCards,
          featuredCollections,
          newArrivals,
          featuredProducts,
        },
      });
      showToast("Homepage layout updated successfully.");
      loadData();
    } catch (error) {
      console.error(error);
      showToast("Error saving homepage layout settings.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-linen/30 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
        Loading Layout Manager Assets...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 p-6 md:p-12 font-body-md text-ink-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in rounded">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header Block */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden rounded">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-deep-navy to-amber-600" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                Homepage Layout Builder
              </h1>
              <p className="text-slate-grey font-body-md text-sm">
                Control exactly what collections and products are showcased on your store's landing page.
              </p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50 shadow transition-all duration-200"
            >
              {saveLoading ? "Saving Changes..." : "Save Layout Grid"}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200/60 p-4 rounded text-xs text-amber-900 leading-relaxed flex gap-2">
            <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
            <div>
              <p className="font-semibold">Zero-Coding Interface Guide</p>
              <p className="mt-0.5">Use the dropdowns to add items to the homepage showcase slots. Drag-and-drop ordering or removal is done by clicking the "✕" button on any card.</p>
            </div>
          </div>
        </div>

        {/* 1. Featured Collections Showcase */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-grey/10 pb-4 gap-4">
            <div>
              <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
                Showcase Collections Grid
              </h3>
              <p className="text-xs text-slate-grey">Featured collections appearing directly below the Hero banner.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider font-bold">Section Tagline Slogan</label>
                <input
                  type="text"
                  value={homepageTagline}
                  onChange={(e) => setHomepageTagline(e.target.value)}
                  className="border-b border-slate-grey/30 px-2 py-1 text-xs outline-none focus:border-deep-navy text-deep-navy font-bold w-48"
                  placeholder="e.g. FEEL THE LUXURY"
                />
              </div>

              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !featuredCollections.includes(val)) {
                    setFeaturedCollections([...featuredCollections, val]);
                  }
                  e.target.value = "";
                }}
                value=""
                className="border border-slate-grey/30 bg-pure-white text-xs px-3 py-1.5 outline-none font-semibold text-deep-navy cursor-pointer rounded self-end"
              >
                <option value="">+ Add Collection</option>
                {allCollections.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Storefront Preview container */}
          <div className="bg-[#F5F4F0]/40 p-6 border border-dashed border-slate-grey/20 rounded space-y-8">
            <div className="text-center">
              <p className="font-label-caps text-[10px] tracking-widest text-slate-grey uppercase font-bold">
                Our Collections
              </p>
              <h2 className="font-headline-md text-lg text-deep-navy font-light uppercase tracking-wider mt-1">
                {homepageTagline || "FEEL THE LUXURY"}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredCollections.map((cId) => {
                const col = allCollections.find((c) => c.id === cId);
                return (
                  <div key={cId} className="border border-slate-grey/20 p-4 bg-pure-white rounded flex flex-col justify-between gap-4 relative group shadow-xs">
                    <button
                      type="button"
                      onClick={() => setFeaturedCollections(featuredCollections.filter((id) => id !== cId))}
                      className="absolute top-2 right-2 text-slate-grey hover:text-red-600 text-sm p-1 transition-colors z-10"
                    >
                      ✕
                    </button>
                    <div className="flex flex-col gap-3">
                      <div className="aspect-[4/5] relative bg-soft-linen rounded overflow-hidden border border-slate-grey/10">
                        {col?.image ? (
                          <img src={col.image} alt={col.title} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">No image</div>
                        )}
                      </div>
                      <div className="min-w-0 text-center">
                        <p className="text-xs font-semibold text-deep-navy truncate uppercase tracking-wider">{col?.title || "Unknown Collection"}</p>
                        <p className="text-[9px] text-slate-grey truncate mt-0.5">{col?.tagline || "No tagline set"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {featuredCollections.length === 0 && (
                <p className="col-span-4 text-center py-12 text-xs text-slate-grey/50 italic">
                  No collections selected. Fallback defaults will be loaded on the homepage.
                </p>
              )}
            </div>

            <div className="text-center border-t border-slate-grey/10 pt-4">
              <span className="inline-block font-button text-[10px] text-deep-navy uppercase tracking-widest border-b border-deep-navy pb-1 cursor-default opacity-85">
                Explore All Collections
              </span>
            </div>
          </div>
        </section>

        {/* 2. New Arrivals Showcase */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex justify-between items-center border-b border-slate-grey/10 pb-4">
            <div>
              <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
                New Arrivals Products
              </h3>
              <p className="text-xs text-slate-grey">Newly launched designs featured under the categories grid.</p>
            </div>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !newArrivals.includes(val)) {
                  setNewArrivals([...newArrivals, val]);
                }
                e.target.value = "";
              }}
              value=""
              className="border border-slate-grey/30 bg-pure-white text-xs px-3 py-1.5 outline-none font-semibold text-deep-navy cursor-pointer rounded"
            >
              <option value="">+ Add Product</option>
              {allProducts.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title} (${p.price})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((pId) => {
              const prod = allProducts.find((p) => p.id === pId);
              return (
                <div key={pId} className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded flex flex-col justify-between gap-4 relative group">
                  <button
                    type="button"
                    onClick={() => setNewArrivals(newArrivals.filter((id) => id !== pId))}
                    className="absolute top-2 right-2 text-slate-grey hover:text-red-600 text-sm p-1 transition-colors"
                  >
                    ✕
                  </button>
                  <div className="flex flex-col gap-3">
                    <div className="aspect-[3/4] relative bg-soft-linen rounded overflow-hidden border border-slate-grey/10">
                      {prod?.image ? (
                        <img src={prod.image} alt={prod.title} className="object-cover w-full h-full mix-blend-multiply" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">No image</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-deep-navy truncate">{prod?.title || "Unknown Product"}</p>
                      <p className="text-[10px] text-slate-grey font-bold">${prod?.price || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {newArrivals.length === 0 && (
              <p className="col-span-4 text-center py-12 border border-dashed border-slate-grey/20 text-xs text-slate-grey/50 italic rounded">
                No products selected. Fallback arrivals will be loaded on the homepage.
              </p>
            )}
          </div>
        </section>

        {/* 3. Featured Showcase */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex justify-between items-center border-b border-slate-grey/10 pb-4">
            <div>
              <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
                Curated Featured Products
              </h3>
              <p className="text-xs text-slate-grey">Top featured catalog items appearing just before the brand details section.</p>
            </div>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !featuredProducts.includes(val)) {
                  setFeaturedProducts([...featuredProducts, val]);
                }
                e.target.value = "";
              }}
              value=""
              className="border border-slate-grey/30 bg-pure-white text-xs px-3 py-1.5 outline-none font-semibold text-deep-navy cursor-pointer rounded"
            >
              <option value="">+ Add Product</option>
              {allProducts.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title} (${p.price})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((pId) => {
              const prod = allProducts.find((p) => p.id === pId);
              return (
                <div key={pId} className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded flex flex-col justify-between gap-4 relative group">
                  <button
                    type="button"
                    onClick={() => setFeaturedProducts(featuredProducts.filter((id) => id !== pId))}
                    className="absolute top-2 right-2 text-slate-grey hover:text-red-600 text-sm p-1 transition-colors"
                  >
                    ✕
                  </button>
                  <div className="flex flex-col gap-3">
                    <div className="aspect-[3/4] relative bg-soft-linen rounded overflow-hidden border border-slate-grey/10">
                      {prod?.image ? (
                        <img src={prod.image} alt={prod.title} className="object-cover w-full h-full mix-blend-multiply" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">No image</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-deep-navy truncate">{prod?.title || "Unknown Product"}</p>
                      <p className="text-[10px] text-slate-grey font-bold">${prod?.price || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {featuredProducts.length === 0 && (
              <p className="col-span-4 text-center py-12 border border-dashed border-slate-grey/20 text-xs text-slate-grey/50 italic rounded">
                No products selected. Fallback featured items will be loaded on the homepage.
              </p>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
