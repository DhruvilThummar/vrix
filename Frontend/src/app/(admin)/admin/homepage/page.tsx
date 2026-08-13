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

  // --- SEO & Brand Philosophy Section State ---
  const [seoSubheading, setSeoSubheading] = useState("Luxury Minimalist Jewellery & Design");
  const [seoHeading, setSeoHeading] = useState("Quiet Luxury & Architectural Form");
  const [seoText, setSeoText] = useState(
    "Welcome to VRIX, the ultimate destination for minimalist luxury jewelry and fine jewellery. Our design philosophy centers around quiet luxury, bringing you architectural, clean forms crafted from premium materials. Whether you are looking for premium gold vermeil rings, daily-wear minimalist necklaces, or elegant silver earrings and bracelets, our curated collections offer timeless pieces that speak in silence. By blending modern aesthetics with ethical, sustainable craftsmanship, VRIX redefines what fine jewelry online means for the conscious shopper. We cater to seekers of luxury jewelry worldwide, capturing the perfect balance of luxury minimalism and everyday durability. Experience the artistry of master goldsmiths and elevate your style with premium jewellery designed for the moments that belong only to you."
  );

  // --- Carousel Settings State ---
  const [collectionsAutoScroll, setCollectionsAutoScroll] = useState(true);
  const [collectionsInterval, setCollectionsInterval] = useState(3.5);
  const [collectionsLoop, setCollectionsLoop] = useState(true);

  const [newArrivalsAutoScroll, setNewArrivalsAutoScroll] = useState(true);
  const [newArrivalsInterval, setNewArrivalsInterval] = useState(4.0);
  const [newArrivalsLoop, setNewArrivalsLoop] = useState(true);

  const [featuredAutoScroll, setFeaturedAutoScroll] = useState(true);
  const [featuredInterval, setFeaturedInterval] = useState(4.5);
  const [featuredLoop, setFeaturedLoop] = useState(true);

  const [categoryLoop, setCategoryLoop] = useState(true);

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

          setSeoSubheading(res.homepage.seoSubheading || "Luxury Minimalist Jewellery & Design");
          setSeoHeading(res.homepage.seoHeading || "Quiet Luxury & Architectural Form");
          setSeoText(
            res.homepage.seoText ||
              "Welcome to VRIX, the ultimate destination for minimalist luxury jewelry and fine jewellery. Our design philosophy centers around quiet luxury, bringing you architectural, clean forms crafted from premium materials. Whether you are looking for premium gold vermeil rings, daily-wear minimalist necklaces, or elegant silver earrings and bracelets, our curated collections offer timeless pieces that speak in silence. By blending modern aesthetics with ethical, sustainable craftsmanship, VRIX redefines what fine jewelry online means for the conscious shopper. We cater to seekers of luxury jewelry worldwide, capturing the perfect balance of luxury minimalism and everyday durability. Experience the artistry of master goldsmiths and elevate your style with premium jewellery designed for the moments that belong only to you."
          );

          const cSettings = res.homepage.carouselSettings || {};
          setCollectionsAutoScroll(cSettings.collectionsAutoScroll ?? true);
          setCollectionsInterval((cSettings.collectionsInterval ?? 3500) / 1000);
          setCollectionsLoop(cSettings.collectionsLoop ?? true);

          setNewArrivalsAutoScroll(cSettings.newArrivalsAutoScroll ?? true);
          setNewArrivalsInterval((cSettings.newArrivalsInterval ?? 4000) / 1000);
          setNewArrivalsLoop(cSettings.newArrivalsLoop ?? true);

          setFeaturedAutoScroll(cSettings.featuredAutoScroll ?? true);
          setFeaturedInterval((cSettings.featuredInterval ?? 4500) / 1000);
          setFeaturedLoop(cSettings.featuredLoop ?? true);

          setCategoryLoop(cSettings.categoryLoop ?? true);
          
          const defaultPhilosophy = [
            { icon: "flare", title: "Intentional Design", description: "Every piece has\na deeper meaning." },
            { icon: "hourglass_empty", title: "Timeless Quality", description: "Crafted to last.\nMade to be lived in." },
            { icon: "eco", title: "Conscious Luxury", description: "Ethical materials.\nThoughtful process." },
            { icon: "favorite_border", title: "Personal Connection", description: "A piece for every\nchapter of you." }
          ];
          const dbPhilosophy = res.homepage.philosophy || [];
          const finalPhilosophy = [...dbPhilosophy];
          while (finalPhilosophy.length < 4) {
            finalPhilosophy.push(defaultPhilosophy[finalPhilosophy.length] || { icon: "flare", title: "", description: "" });
          }
          setPhilosophyCards(finalPhilosophy);
          
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
          seoSubheading,
          seoHeading,
          seoText,
          carouselSettings: {
            collectionsAutoScroll,
            collectionsInterval: Math.round(collectionsInterval * 1000),
            collectionsLoop,
            newArrivalsAutoScroll,
            newArrivalsInterval: Math.round(newArrivalsInterval * 1000),
            newArrivalsLoop,
            featuredAutoScroll,
            featuredInterval: Math.round(featuredInterval * 1000),
            featuredLoop,
            categoryLoop,
          }
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

        {/* Hero Fallback Banner (Single Image Mode) */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
            <h3 className="font-headline-md text-lg text-deep-navy uppercase">
              Hero Fallback Banner (Single Image Mode)
            </h3>
            <span className="text-[10px] font-label-caps bg-slate-grey/10 text-slate-grey px-2 py-0.5 rounded font-bold">Fallback Mode</span>
          </div>
          <p className="text-xs text-slate-grey font-body-md leading-relaxed">
            Configure the single hero banner settings. This will be used as a fallback if no slides are added to the Carousel Slides below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Title</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. the moments that belong only to you."
                className="border border-slate-grey/30 p-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Subtitle</label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g. Luxury for Every Day"
                className="border border-slate-grey/30 p-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Image URL</label>
              <input
                type="url"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/..."
                className="border border-slate-grey/30 p-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
              />
              <VisualImagePreview src={heroImage} alt="Hero fallback preview" />
            </div>
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

          {/* Carousel Settings Configuration Panel */}
          <div className="space-y-4 pt-6 border-t border-slate-grey/15">
            <h4 className="font-label-caps text-xs font-bold text-deep-navy uppercase">
              Homepage Carousel Settings
            </h4>
            <p className="text-xs text-slate-grey font-body-md leading-relaxed">
              Enable/Disable automatic sliding and manage timing intervals (in seconds) for each carousel showcase section on the store landing page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Collections Carousel Settings */}
              <div className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded space-y-3">
                <span className="text-[10px] font-label-caps bg-deep-navy/10 text-deep-navy px-1.5 py-0.5 rounded font-bold">
                  Collections Showcase
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-grey">Auto Scroll</span>
                  <input
                    type="checkbox"
                    checked={collectionsAutoScroll}
                    onChange={(e) => setCollectionsAutoScroll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-label-caps text-slate-grey">Interval (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={collectionsInterval}
                    onChange={(e) => setCollectionsInterval(parseFloat(e.target.value) || 3.5)}
                    disabled={!collectionsAutoScroll}
                    className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent rounded disabled:opacity-50"
                  />
                </div>
              </div>

              {/* New Arrivals Carousel Settings */}
              <div className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded space-y-3">
                <span className="text-[10px] font-label-caps bg-deep-navy/10 text-deep-navy px-1.5 py-0.5 rounded font-bold">
                  New Arrivals
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-grey">Auto Scroll</span>
                  <input
                    type="checkbox"
                    checked={newArrivalsAutoScroll}
                    onChange={(e) => setNewArrivalsAutoScroll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-label-caps text-slate-grey">Interval (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={newArrivalsInterval}
                    onChange={(e) => setNewArrivalsInterval(parseFloat(e.target.value) || 4.0)}
                    disabled={!newArrivalsAutoScroll}
                    className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent rounded disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Featured Products Carousel Settings */}
              <div className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded space-y-3">
                <span className="text-[10px] font-label-caps bg-deep-navy/10 text-deep-navy px-1.5 py-0.5 rounded font-bold">
                  Featured Products
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-grey">Auto Scroll</span>
                  <input
                    type="checkbox"
                    checked={featuredAutoScroll}
                    onChange={(e) => setFeaturedAutoScroll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-label-caps text-slate-grey">Interval (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={featuredInterval}
                    onChange={(e) => setFeaturedInterval(parseFloat(e.target.value) || 4.5)}
                    disabled={!featuredAutoScroll}
                    className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent rounded disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-grey/15">
            <h4 className="font-label-caps text-xs font-bold text-deep-navy uppercase">
              Brand Philosophy Cards (4 Slots)
            </h4>
            <p className="text-xs text-slate-grey font-body-md leading-relaxed">
              Customize the four values cards displayed on the storefront. Use standard Google Material symbols names for icons (e.g. flare, eco, favorite_border, hourglass_empty).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              {philosophyCards.map((card, idx) => (
                <div key={idx} className="border border-slate-grey/20 p-4 bg-soft-linen/5 rounded space-y-4 relative">
                  <span className="absolute top-2 right-2 text-[10px] font-label-caps bg-deep-navy/10 text-deep-navy px-1.5 py-0.5 rounded font-bold">
                    Slot {idx + 1}
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Icon (Material Icon Name)</label>
                    <input
                      type="text"
                      value={card.icon || ""}
                      onChange={(e) => {
                        const updated = [...philosophyCards];
                        updated[idx] = { ...updated[idx], icon: e.target.value };
                        setPhilosophyCards(updated);
                      }}
                      placeholder="e.g. flare"
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent"
                    />
                    {card.icon && (
                      <div className="flex items-center gap-1.5 mt-1 text-deep-navy">
                        <span className="material-symbols-outlined text-base font-light">{card.icon}</span>
                        <span className="text-[9px] font-label-caps text-slate-grey">Live Icon Preview</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Title</label>
                    <input
                      type="text"
                      value={card.title || ""}
                      onChange={(e) => {
                        const updated = [...philosophyCards];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setPhilosophyCards(updated);
                      }}
                      placeholder="e.g. Intentional Design"
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">Description</label>
                    <textarea
                      value={card.description || ""}
                      onChange={(e) => {
                        const updated = [...philosophyCards];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setPhilosophyCards(updated);
                      }}
                      placeholder="e.g. Every piece has a deeper meaning."
                      rows={3}
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO & Minimalist Luxury Brand Intro Section */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="border-b border-slate-grey/10 pb-4">
            <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
              SEO &amp; Brand Philosophy Section
            </h3>
            <p className="text-xs text-slate-grey">Configure the homepage luxury SEO editorial section and Chancery font heading.</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">
                Section Subheading (Uppercase Label)
              </label>
              <input
                type="text"
                value={seoSubheading}
                onChange={(e) => setSeoSubheading(e.target.value)}
                placeholder="e.g. Luxury Minimalist Jewellery & Design"
                className="border border-slate-grey/30 p-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent rounded"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">
                Main Headline (Rendered in Chancery Highlight Font)
              </label>
              <input
                type="text"
                value={seoHeading}
                onChange={(e) => setSeoHeading(e.target.value)}
                placeholder="e.g. Quiet Luxury & Architectural Form"
                className="border border-slate-grey/30 p-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent rounded"
              />
              <p className="text-[10px] text-slate-grey italic">Preview: <span className="font-chancery text-base text-deep-navy">{seoHeading || "Quiet Luxury & Architectural Form"}</span></p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest font-semibold">
                Detailed Brand Description &amp; SEO Text (150+ words)
              </label>
              <textarea
                value={seoText}
                onChange={(e) => setSeoText(e.target.value)}
                rows={6}
                placeholder="Welcome to VRIX, the ultimate destination for minimalist luxury jewelry..."
                className="border border-slate-grey/30 p-3 focus:border-deep-navy outline-none font-body-md text-ink-black text-xs bg-transparent leading-relaxed rounded"
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

        {/* Carousel & Slider Animation Settings */}
        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
          <div className="border-b border-slate-grey/10 pb-4">
            <h3 className="font-headline-md text-base text-deep-navy uppercase tracking-wider font-semibold">
              Carousel &amp; Slider Loop Controls
            </h3>
            <p className="text-xs text-slate-grey">Configure autoplay, scroll speed, and infinite loop behavior for homepage sliders.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Carousel Settings */}
            <div className="p-4 border border-slate-grey/20 rounded bg-soft-linen/5 space-y-3">
              <h4 className="font-label-caps text-xs uppercase font-bold text-deep-navy">Category Slider</h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-black">
                <input
                  type="checkbox"
                  checked={categoryLoop}
                  onChange={(e) => setCategoryLoop(e.target.checked)}
                  className="text-deep-navy"
                />
                Infinite Loop (Loop back to 1st item)
              </label>
            </div>

            {/* New Arrivals Carousel Settings */}
            <div className="p-4 border border-slate-grey/20 rounded bg-soft-linen/5 space-y-3">
              <h4 className="font-label-caps text-xs uppercase font-bold text-deep-navy">New Arrivals Slider</h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-black">
                <input
                  type="checkbox"
                  checked={newArrivalsAutoScroll}
                  onChange={(e) => setNewArrivalsAutoScroll(e.target.checked)}
                  className="text-deep-navy"
                />
                Autoplay Auto-Scroll
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-grey font-label-caps uppercase">Interval (s):</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={newArrivalsInterval}
                  onChange={(e) => setNewArrivalsInterval(Number(e.target.value))}
                  className="w-16 border border-slate-grey/30 px-2 py-1 text-xs outline-none rounded"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-black pt-1">
                <input
                  type="checkbox"
                  checked={newArrivalsLoop}
                  onChange={(e) => setNewArrivalsLoop(e.target.checked)}
                  className="text-deep-navy"
                />
                Infinite Loop (Loop back to 1st item)
              </label>
            </div>

            {/* Featured Products Carousel Settings */}
            <div className="p-4 border border-slate-grey/20 rounded bg-soft-linen/5 space-y-3">
              <h4 className="font-label-caps text-xs uppercase font-bold text-deep-navy">Featured Products Slider</h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-black">
                <input
                  type="checkbox"
                  checked={featuredAutoScroll}
                  onChange={(e) => setFeaturedAutoScroll(e.target.checked)}
                  className="text-deep-navy"
                />
                Autoplay Auto-Scroll
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-grey font-label-caps uppercase">Interval (s):</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={featuredInterval}
                  onChange={(e) => setFeaturedInterval(Number(e.target.value))}
                  className="w-16 border border-slate-grey/30 px-2 py-1 text-xs outline-none rounded"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-black pt-1">
                <input
                  type="checkbox"
                  checked={featuredLoop}
                  onChange={(e) => setFeaturedLoop(e.target.checked)}
                  className="text-deep-navy"
                />
                Infinite Loop (Loop back to 1st item)
              </label>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
