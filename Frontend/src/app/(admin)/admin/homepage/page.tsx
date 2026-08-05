"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS, fetchProducts, fetchCollections } from "@/utils/api";

function VisualImagePreview({ src, alt }: { src?: string; alt?: string }) {
  if (!src) {
    return (
      <div className="mt-2 w-28 h-20 relative bg-soft-linen/50 border border-slate-grey/20 rounded overflow-hidden flex items-center justify-center text-[10px] text-slate-grey italic">
        No Image
      </div>
    );
  }
  return (
    <div className="mt-2 w-48 h-32 relative bg-soft-linen/50 border border-slate-grey/20 rounded overflow-hidden flex items-center justify-center">
      <img src={src} alt={alt || "Preview"} className="object-cover w-full h-full" />
    </div>
  );
}

interface CategoryItem {
  title: string;
  image: string;
  link: string;
}

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

  // --- Hero & Philosophy Settings ---
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideImage, setSlideImage] = useState("");
  const [slideLink, setSlideLink] = useState("");
  const [slideLinkText, setSlideLinkText] = useState("");
  const [editSlideIdx, setEditSlideIdx] = useState<number | null>(null);

  const [homepageTagline, setHomepageTagline] = useState("");
  const [philosophyTitle, setPhilosophyTitle] = useState("");
  const [philosophyCards, setPhilosophyCards] = useState<any[]>([]);

  // --- Categories State ---
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editCategoryIdx, setEditCategoryIdx] = useState<number | null>(null);
  const [catTitle, setCatTitle] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catLink, setCatLink] = useState("");

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

          setHeroTitle(res.homepage.heroTitle || "");
          setHeroSubtitle(res.homepage.heroSubtitle || "");
          setHeroImage(res.homepage.heroImage || "");
          setHeroSlides(res.homepage.heroSlides || []);
          setHomepageTagline(res.homepage.tagline || "");
          setPhilosophyTitle(res.homepage.philosophyTitle || "");
          setPhilosophyCards(res.homepage.philosophy || []);
          setCategories(res.homepage.categories || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading homepage settings.");
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
          heroSlides,
          tagline: homepageTagline,
          philosophyTitle,
          philosophy: philosophyCards,
          featuredCollections,
          newArrivals,
          featuredProducts,
          categories,
        },
      });
      showToast("Homepage layout and settings updated successfully.");
      loadData();
    } catch (error) {
      console.error(error);
      showToast("Error saving homepage settings.");
    } finally {
      setSaveLoading(false);
    }
  };

  const addSlide = () => {
    if (!slideImage) {
      showToast("Slide Image URL is required.");
      return;
    }
    const newSlide = {
      title: slideTitle,
      subtitle: slideSubtitle,
      image: slideImage,
      link: slideLink,
      linkText: slideLinkText || "Discover Collections",
    };
    if (editSlideIdx !== null) {
      const updated = [...heroSlides];
      updated[editSlideIdx] = newSlide;
      setHeroSlides(updated);
      setEditSlideIdx(null);
    } else {
      setHeroSlides([...heroSlides, newSlide]);
    }
    setSlideTitle("");
    setSlideSubtitle("");
    setSlideImage("");
    setSlideLink("");
    setSlideLinkText("");
  };

  const editSlide = (idx: number) => {
    const slide = heroSlides[idx];
    setSlideTitle(slide.title || "");
    setSlideSubtitle(slide.subtitle || "");
    setSlideImage(slide.image || "");
    setSlideLink(slide.link || "");
    setSlideLinkText(slide.linkText || "");
    setEditSlideIdx(idx);
  };

  const removeSlide = (idx: number) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== idx));
    if (editSlideIdx === idx) {
      setEditSlideIdx(null);
      setSlideTitle("");
      setSlideSubtitle("");
      setSlideImage("");
      setSlideLink("");
      setSlideLinkText("");
    }
  };

  const moveSlide = (idx: number, direction: "up" | "down") => {
    const updated = [...heroSlides];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setHeroSlides(updated);
  };

  const addCategory = () => {
    if (!catTitle || !catImage || !catLink) {
      showToast("Please fill all category fields.");
      return;
    }
    const newCat: CategoryItem = { title: catTitle, image: catImage, link: catLink };
    if (editCategoryIdx !== null) {
      const updated = [...categories];
      updated[editCategoryIdx] = newCat;
      setCategories(updated);
      setEditCategoryIdx(null);
    } else {
      setCategories([...categories, newCat]);
    }
    setCatTitle("");
    setCatImage("");
    setCatLink("");
  };

  const editCategory = (idx: number) => {
    const cat = categories[idx];
    setCatTitle(cat.title);
    setCatImage(cat.image);
    setCatLink(cat.link);
    setEditCategoryIdx(idx);
  };

  const removeCategory = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
    if (editCategoryIdx === idx) {
      setEditCategoryIdx(null);
      setCatTitle("");
      setCatImage("");
      setCatLink("");
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
                Homepage Manager
              </h1>
              <p className="text-slate-grey font-body-md text-sm">
                Control the Hero banner, Collections tagline, Brand Philosophy, and curated product showcases on the storefront landing page.
              </p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50 shadow transition-all duration-200"
            >
              {saveLoading ? "Saving Changes..." : "Save Homepage Settings"}
            </button>
          </div>
        </div>

        {/* Hero Settings Section */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
            Homepage Hero Banner Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Subtitle</label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Title</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black bg-transparent"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Image URL</label>
            <input
              type="url"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
              required
            />
            <VisualImagePreview src={heroImage} alt="Hero banner preview" />
          </div>
        </section>

        {/* Hero Carousel Slides Manager */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
            <h3 className="font-headline-md text-lg text-deep-navy uppercase">
              Homepage Hero Carousel Slides
            </h3>
            <span className="text-[10px] font-label-caps bg-deep-navy/10 text-deep-navy px-2 py-0.5 rounded font-bold">New Carousel Mode</span>
          </div>
          <p className="text-xs text-slate-grey font-body-md leading-relaxed">
            Configure multiple slides for the hero section. When slides are added, they will act as a sliding carousel. If no slides are configured, the single image settings above will be used as a fallback.
          </p>

          {/* Current Slides list */}
          {heroSlides.length > 0 && (
            <div className="space-y-3">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold block">Current Slides ({heroSlides.length})</label>
              <div className="grid grid-cols-1 gap-3">
                {heroSlides.map((slide, sIdx) => (
                  <div key={sIdx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-soft-linen bg-surface/30 gap-4 rounded">
                    <div className="flex items-center gap-4">
                      {slide.image && (
                        <div className="w-16 h-12 relative bg-soft-linen rounded overflow-hidden shrink-0 border border-slate-grey/10">
                          <img src={slide.image} alt={slide.title} className="object-cover w-full h-full" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-label-caps text-xs font-semibold text-deep-navy uppercase">{slide.title || "No Title"}</h4>
                        <p className="text-[10px] text-slate-grey uppercase tracking-wider">{slide.subtitle || "No Subtitle"}</p>
                        <p className="text-[9px] font-mono text-slate-grey mt-0.5 truncate max-w-xs">{slide.link} ({slide.linkText})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSlide(sIdx, "up")}
                        disabled={sIdx === 0}
                        className="p-1 hover:text-deep-navy text-slate-grey disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(sIdx, "down")}
                        disabled={sIdx === heroSlides.length - 1}
                        className="p-1 hover:text-deep-navy text-slate-grey disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editSlide(sIdx)}
                        className="p-1 text-slate-grey hover:text-ink-black cursor-pointer"
                        title="Edit Slide"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlide(sIdx)}
                        className="p-1 text-slate-grey hover:text-red-600 cursor-pointer"
                        title="Delete Slide"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add / Edit Slide Box */}
          <div className="border border-soft-linen bg-surface/20 p-6 rounded space-y-4">
            <h4 className="font-label-caps text-xs font-bold text-deep-navy uppercase border-b border-soft-linen pb-2">
              {editSlideIdx !== null ? "Edit Carousel Slide" : "Add New Carousel Slide"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Slide Subtitle</label>
                <input
                  type="text"
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  placeholder="e.g. Luxury for Every Day"
                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Slide Title</label>
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="e.g. PIECES THAT SPEAK IN SILENCE"
                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-2 col-span-2">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Slide Image URL</label>
                <input
                  type="url"
                  value={slideImage}
                  onChange={(e) => setSlideImage(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/..."
                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                />
                <VisualImagePreview src={slideImage} alt="Slide preview" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Slide Button Link</label>
                <input
                  type="text"
                  value={slideLink}
                  onChange={(e) => setSlideLink(e.target.value)}
                  placeholder="e.g. /collections/rings"
                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Slide Button Text</label>
                <input
                  type="text"
                  value={slideLinkText}
                  onChange={(e) => setSlideLinkText(e.target.value)}
                  placeholder="e.g. Discover Collections"
                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              {editSlideIdx !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditSlideIdx(null);
                    setSlideTitle("");
                    setSlideSubtitle("");
                    setSlideImage("");
                    setSlideLink("");
                    setSlideLinkText("");
                  }}
                  className="px-4 py-2 border border-slate-grey/40 hover:bg-soft-linen/30 font-label-caps text-[10px] tracking-widest uppercase cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={addSlide}
                className="px-5 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-[10px] tracking-widest uppercase cursor-pointer shadow transition-all duration-200"
              >
                {editSlideIdx !== null ? "Update Slide" : "Add Slide"}
              </button>
            </div>
          </div>
        </section>

        {/* Collections Slogan & Philosophy */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
            Collections Slogan & Brand Philosophy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Collections Section Slogan</label>
              <input
                type="text"
                value={homepageTagline}
                onChange={(e) => setHomepageTagline(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black bg-transparent"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Philosophy Section Title</label>
              <textarea
                value={philosophyTitle}
                onChange={(e) => setPhilosophyTitle(e.target.value)}
                className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                rows={2}
                required
              />
            </div>
          </div>
        </section>

        {/* Curated Featured Collections */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-grey/10 pb-4 gap-4">
            <div>
              <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
                Showcase Collections Grid
              </h3>
              <p className="text-xs text-slate-grey">Featured collections appearing directly below the Hero banner.</p>
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
              className="border border-slate-grey/30 bg-pure-white text-xs px-3 py-1.5 outline-none font-semibold text-deep-navy cursor-pointer rounded"
            >
              <option value="">+ Add Collection</option>
              {allCollections.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
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
          </div>
        </section>

        {/* ─── Shop By Category Manager ─── */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="border-b border-slate-grey/10 pb-4">
            <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
              Category Showcase Manager
            </h3>
            <p className="text-xs text-slate-grey">Configure and add custom category blocks that point customers to specific searches or collections.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-soft-linen/20 p-6 border border-slate-grey/15 rounded">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Category Title</label>
              <input
                type="text"
                placeholder="e.g. Rings"
                value={catTitle}
                onChange={(e) => setCatTitle(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={catImage}
                onChange={(e) => setCatImage(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Destination Link</label>
              <input
                type="text"
                placeholder="e.g. /collections/silent-center?type=rings"
                value={catLink}
                onChange={(e) => setCatLink(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black bg-transparent"
              />
            </div>
            <button
              type="button"
              onClick={addCategory}
              className="md:col-span-3 mt-4 py-2 px-6 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white font-label-caps text-xs tracking-widest uppercase transition-colors rounded self-start"
            >
              {editCategoryIdx !== null ? "Update Category Slot" : "+ Add Category Slot"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="border border-slate-grey/25 bg-pure-white p-4 relative group flex flex-col justify-between gap-4">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => editCategory(idx)}
                    className="bg-pure-white/80 p-1 rounded border hover:text-deep-navy"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    className="bg-pure-white/80 p-1 rounded border hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="aspect-square relative bg-soft-linen overflow-hidden border border-slate-grey/10">
                    <img src={cat.image} alt={cat.title} className="object-cover w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-deep-navy uppercase tracking-wider">{cat.title}</p>
                    <p className="text-[9px] text-slate-grey truncate">{cat.link}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Arrivals Showcase */}
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

        {/* Curated Featured Products */}
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
