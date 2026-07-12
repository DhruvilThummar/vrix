"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct, uploadMediaMultiple,
  updateProductStock, updateProductVisibility, fetchAllCollections,
} from "@/utils/api";

const DEFAULT_COLLECTIONS = ["silent-center", "solitude", "presence", "light"];
const DEFAULT_COLLECTION_LABELS: Record<string, string> = {
  "silent-center": "Silent Center",
  solitude: "Solitude",
  presence: "Presence",
  light: "Light",
};
const PRODUCT_TYPES = ["Ring", "Necklace", "Earring", "Bracelet", "Pendant", "Cuff"];

type Product = {
  id: string;
  title: string;
  material: string;
  type: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  collection?: string;
  stock?: number;
  isVisible?: boolean;
  alt?: string;
};

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const paramDrawer = searchParams.get("drawer");

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollection, setFilterCollection] = useState("All");
  const [filterVisibility, setFilterVisibility] = useState("All");
  const [collectionOptions, setCollectionOptions] = useState(DEFAULT_COLLECTIONS);
  const [collectionLabels, setCollectionLabels] = useState<Record<string, string>>(DEFAULT_COLLECTION_LABELS);

  // Form fields
  const [fTitle, setFTitle] = useState("");
  const [fMaterial, setFMaterial] = useState("");
  const [fType, setFType] = useState("Ring");
  const [fPrice, setFPrice] = useState(0);
  const [fImage, setFImage] = useState("");
  const [fImages, setFImages] = useState<string[]>([]);
  const [fDescription, setFDescription] = useState("");
  const [fCollection, setFCollection] = useState("silent-center");
  const [fStock, setFStock] = useState(999);
  const [fVisible, setFVisible] = useState(true);

  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProducts = () => {
    setLoading(true);
    fetchProducts()
      .then((res) => { setProducts(res); setLoading(false); })
      .catch(() => { setLoading(false); showToast("Error loading products.", "err"); });
  };

  const loadCollections = () => {
    fetchAllCollections()
      .then((collections) => {
        if (collections.length === 0) return;
        const ids = collections
          .map((collection: any) => String(collection.id || "").trim())
          .filter(Boolean);
        const labels = collections.reduce((acc: Record<string, string>, collection: any) => {
          const id = String(collection.id || "").trim();
          if (id) acc[id] = collection.title || id;
          return acc;
        }, {});
        setCollectionOptions(Array.from(new Set([...DEFAULT_COLLECTIONS, ...ids])));
        setCollectionLabels({ ...DEFAULT_COLLECTION_LABELS, ...labels });
      })
      .catch(() => showToast("Error loading collections.", "err"));
  };

  const normalizeImages = (image: string, images?: string[]) => {
    const urls = [image, ...(Array.isArray(images) ? images : [])]
      .filter((url): url is string => typeof url === "string")
      .map((url) => url.trim())
      .filter(Boolean);
    return Array.from(new Set(urls));
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setIsNew(false);
    setFTitle(p.title || ""); setFMaterial(p.material || "");
    setFType(p.type || "Ring"); setFPrice(p.price || 0);
    setFImage(p.image || "");
    setFImages(normalizeImages(p.image || "", p.images));
    setFDescription(p.description || "");
    setFCollection(p.collection || "silent-center");
    setFStock(p.stock ?? 999); setFVisible(p.isVisible !== false);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null); setIsNew(true);
    setFTitle(""); setFMaterial(""); setFType("Ring");
    setFPrice(0); setFImage(""); setFImages([]); setFDescription("");
    setFCollection("silent-center"); setFStock(999); setFVisible(true);
  };

  useEffect(() => {
    loadProducts();
    loadCollections();
  }, []);

  // Handle URL parameters for selecting a product or opening the drawer
  useEffect(() => {
    if (loading || products.length === 0) return;

    if (paramId) {
      const match = products.find(p => p.id === paramId);
      if (match) {
        selectProduct(match);
      }
    } else if (paramDrawer === "new") {
      handleNewProduct();
    }
  }, [paramId, paramDrawer, products, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadLoading(true);
    try {
      const result = await uploadMediaMultiple(files);
      const uploadedUrls = result.results
        .filter((item) => item.success && item.url)
        .map((item) => item.url as string);

      if (uploadedUrls.length === 0) {
        throw new Error(result.results.find((item) => item.error)?.error || "No images uploaded");
      }

      const nextImages = Array.from(new Set([...fImages, ...uploadedUrls]));
      setFImages(nextImages);
      if (!fImage) setFImage(nextImages[0]);
      showToast(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded.`);
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "err");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFImage(url);
    setFImages(normalizeImages(url, fImages));
  };

  const handleRemoveImage = (url: string) => {
    const nextImages = fImages.filter((img) => img !== url);
    setFImages(nextImages);
    if (fImage === url) setFImage(nextImages[0] || "");
  };

  const handleSetCoverImage = (url: string) => {
    setFImage(url);
    setFImages(normalizeImages(url, fImages));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const productImages = normalizeImages(fImage, fImages);
    if (!fTitle.trim() || fPrice === undefined || fPrice === null || isNaN(fPrice) || fPrice < 0 || productImages.length === 0) {
      showToast("Title, price, and at least one image are required.", "err");
      return;
    }
    setSaveLoading(true);
    const prodData = {
      title: fTitle, material: fMaterial, type: fType,
      price: Number(fPrice), image: fImage || productImages[0], images: productImages, description: fDescription,
      collection: fCollection, stock: Number(fStock), isVisible: fVisible,
      alt: `A minimalist architectural ${fType} by VRIX from the ${collectionLabels[fCollection] || fCollection} collection.`,
    };
    try {
      if (isNew) {
        const created = await createProduct(prodData);
        showToast(`Created "${created.title}"`);
      } else if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, prodData);
        showToast(`Updated "${updated.title}"`);
      }
      loadProducts();
    } catch (err: any) {
      showToast("Error: " + err.message, "err");
    } finally { setSaveLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedProduct || isNew) return;
    if (!confirm(`Delete "${selectedProduct.title}"? This is irreversible.`)) return;
    setSaveLoading(true);
    try {
      await deleteProduct(selectedProduct.id);
      showToast("Product deleted.");
      setSelectedProduct(null); setIsNew(false);
      loadProducts();
    } catch (err: any) {
      showToast("Error: " + err.message, "err");
    } finally { setSaveLoading(false); }
  };

  const handleToggleVisibility = async (p: Product) => {
    try {
      await updateProductVisibility(p.id, !(p.isVisible !== false));
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isVisible: !(p.isVisible !== false) } : x));
      if (selectedProduct?.id === p.id) setFVisible(!(p.isVisible !== false));
      showToast(`"${p.title}" ${p.isVisible !== false ? "hidden" : "visible"} on store.`);
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
  };

  const handleStockChange = async (p: Product, newStock: number) => {
    try {
      await updateProductStock(p.id, newStock);
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, stock: newStock } : x));
      if (selectedProduct?.id === p.id) setFStock(newStock);
    } catch (err: any) { showToast("Stock update failed: " + err.message, "err"); }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collection?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCol = filterCollection === "All" || p.collection === filterCollection;
    const matchVis = filterVisibility === "All"
      ? true
      : filterVisibility === "visible" ? p.isVisible !== false : p.isVisible === false;
    return matchSearch && matchCol && matchVis;
  });

  const stockBadge = (stock: number | undefined) => {
    const s = stock ?? 999;
    if (s === 0) return "bg-red-50 text-red-700 border-red-200";
    if (s <= 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${toast.type === "ok" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "ok" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-grey/20 pb-6">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Product Catalogue</h1>
            <p className="text-slate-grey font-body-md text-sm mt-1">{products.length} products total · {products.filter((p) => p.isVisible !== false).length} visible · {products.filter((p) => (p.stock ?? 999) === 0).length} out of stock</p>
          </div>
          <button onClick={handleNewProduct} className="font-button text-button uppercase px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-grey text-[16px]">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-xs border border-slate-grey/25 focus:border-deep-navy outline-none font-body-md bg-pure-white" />
          </div>
          <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)} className="px-3 py-2 text-xs border border-slate-grey/25 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
            <option value="All">All Collections</option>
            {collectionOptions.map((c) => <option key={c} value={c}>{collectionLabels[c] || c}</option>)}
          </select>
          <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="px-3 py-2 text-xs border border-slate-grey/25 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
            <option value="All">All Visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">{filteredProducts.length} results</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Inventory...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Product Table */}
            <div className="xl:col-span-3 bg-pure-white border border-slate-grey/25 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-grey/10 overflow-y-auto max-h-[700px]">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id && !isNew;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${isSelected ? "bg-soft-linen/40 border-l-2 border-deep-navy" : "hover:bg-soft-linen/20"}`}
                      onClick={() => selectProduct(p)}
                    >
                      {/* Product Image */}
                      <div className="w-10 h-12 relative bg-soft-linen overflow-hidden shrink-0 border border-slate-grey/10">
                        <Image src={p.image} alt={p.title} fill className="object-cover mix-blend-multiply" sizes="40px" />
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="font-body-md text-sm text-ink-black truncate font-medium">{p.title}</h4>
                        <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-wider">{collectionLabels[p.collection || ""] || p.collection} · {p.type}</p>
                        <p className="text-xs text-deep-navy font-semibold">${p.price}</p>
                      </div>
                      {/* Stock badge */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-0.5 border ${stockBadge(p.stock)}`}>
                          {(p.stock ?? 999) === 0 ? "Out" : `${p.stock ?? "∞"} left`}
                        </span>
                        {/* Visibility toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleVisibility(p); }}
                          className={`flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest transition-colors cursor-pointer ${p.isVisible !== false ? "text-green-700" : "text-slate-grey"}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{p.isVisible !== false ? "visibility" : "visibility_off"}</span>
                          {p.isVisible !== false ? "Live" : "Hidden"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="p-8 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">No products match filters</div>
                )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="xl:col-span-2 bg-pure-white border border-slate-grey/25 shadow-sm p-6 overflow-y-auto max-h-[700px]">
              {!selectedProduct && !isNew ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-grey py-16">
                  <span className="material-symbols-outlined text-4xl">touch_app</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">Select a product to edit</p>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                    <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                      {isNew ? "Create Product" : `Editing`}
                    </h3>
                    {!isNew && (
                      <button type="button" onClick={handleDelete} className="text-[10px] font-label-caps uppercase text-red-600 hover:underline flex items-center gap-1 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">delete</span>Delete
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Title *</label>
                    <input type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required placeholder="Product Title" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                  </div>

                  {/* Price + Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Price (USD) *</label>
                      <input type="number" value={fPrice} onChange={(e) => setFPrice(Number(e.target.value))} min={0} required className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Type</label>
                      <select value={fType} onChange={(e) => setFType(e.target.value)} className="border-b border-slate-grey/30 py-1.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                        {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Material + Collection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Material</label>
                      <input type="text" value={fMaterial} onChange={(e) => setFMaterial(e.target.value)} placeholder="e.g. Recycled Silver" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Collection</label>
                      <select value={fCollection} onChange={(e) => setFCollection(e.target.value)} className="border-b border-slate-grey/30 py-1.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                        {collectionOptions.map((c) => <option key={c} value={c}>{collectionLabels[c] || c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Stock + Visibility */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Stock Units</label>
                      <input type="number" value={fStock} onChange={(e) => setFStock(Number(e.target.value))} min={0} className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Storefront</label>
                      <button
                        type="button"
                        onClick={() => setFVisible(!fVisible)}
                        className={`flex items-center gap-2 py-1.5 font-label-caps text-[10px] uppercase tracking-widest border-b cursor-pointer transition-colors ${fVisible ? "border-green-400 text-green-700" : "border-slate-grey/30 text-slate-grey"}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{fVisible ? "visibility" : "visibility_off"}</span>
                        {fVisible ? "Visible (Live)" : "Hidden"}
                      </button>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Product Images *</label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <input type="url" value={fImage} onChange={(e) => handleImageUrlChange(e.target.value)} placeholder="Cover image URL or upload below" className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                        <div className="flex items-center gap-2">
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="prod-img-upload" />
                          <label htmlFor="prod-img-upload" className={`inline-flex items-center gap-1.5 font-button text-[9px] uppercase px-3 py-1.5 border border-slate-grey/30 text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer ${uploadLoading ? "opacity-50 pointer-events-none" : ""}`}>
                            {uploadLoading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[12px]">upload</span>}
                            {uploadLoading ? "Uploading..." : "Upload Images"}
                          </label>
                          <span className="text-[9px] text-slate-grey">JPG · PNG · WebP</span>
                        </div>
                        {fImages.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 pt-2">
                            {fImages.map((url) => (
                              <div key={url} className={`relative aspect-[4/5] bg-soft-linen border overflow-hidden ${url === fImage ? "border-deep-navy" : "border-slate-grey/15"}`}>
                                <button type="button" onClick={() => handleSetCoverImage(url)} className="absolute inset-0 z-10 cursor-pointer" aria-label="Set cover image" />
                                <Image src={url} alt="Product gallery" fill className="object-cover mix-blend-multiply" sizes="80px" />
                                {url === fImage && <span className="absolute left-1 bottom-1 z-20 bg-deep-navy text-pure-white text-[8px] font-label-caps uppercase px-1 py-0.5">Cover</span>}
                                <button type="button" onClick={() => handleRemoveImage(url)} className="absolute right-1 top-1 z-20 w-5 h-5 bg-pure-white/90 border border-slate-grey/30 text-ink-black flex items-center justify-center cursor-pointer" aria-label="Remove image">
                                  <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {fImage && (
                        <div className="w-20 h-24 relative bg-soft-linen overflow-hidden border border-slate-grey/15 shrink-0">
                          <Image src={fImage} alt="Preview" fill className="object-cover mix-blend-multiply" sizes="80px" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Description</label>
                    <textarea rows={3} value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="Product description..." className="border border-slate-grey/25 p-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black resize-y text-xs" />
                  </div>

                  {/* Save */}
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={saveLoading} className="flex-1 font-button text-button uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {saveLoading ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" /> : (isNew ? "Create" : "Save Changes")}
                    </button>
                    {isNew && (
                      <button type="button" onClick={() => { setIsNew(false); setSelectedProduct(null); }} className="px-4 font-button text-button uppercase border border-slate-grey/30 text-ink-black hover:border-ink-black transition-colors cursor-pointer text-sm">✕</button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
