"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct, uploadMediaMultiple,
  updateProductStock, updateProductVisibility, fetchAllCollections,
} from "@/utils/api";
import { useCurrency } from "@/utils/useCurrency";

const DEFAULT_COLLECTIONS = ["silent-center", "solitude", "presence", "light"];
const DEFAULT_COLLECTION_LABELS: Record<string, string> = {
  "silent-center": "Silent Center",
  solitude: "Solitude",
  presence: "Presence",
  light: "Light",
};
const PRODUCT_TYPES = ["Ring", "Necklace", "Earring", "Bracelet", "Pendant", "Cuff", "Brooch", "Anklet"];
const MATERIAL_PRESETS = [
  "18K Yellow Gold", "18K White Gold", "18K Rose Gold", "Platinum",
  "Sterling Silver", "Recycled Gold", "Lab-Grown Diamond", "Natural Diamond",
];
const RING_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
const FORM_TABS = ["Core", "Media", "Pricing", "Customizations"] as const;
type FormTab = typeof FORM_TABS[number];

type Product = {
  id: string;
  title: string;
  material: string;
  type: string;
  price: number;
  originalPrice?: number;
  layoutStyle?: "2x2" | "asymmetric";
  image: string;
  images?: string[];
  description?: string;
  collection?: string;
  stock?: number;
  isVisible?: boolean;
  isVrixPlusExclusive?: boolean;
  vrixPlusPrice?: number;
  engravingOptions?: { enabled: boolean; limit: number; price: number };
  giftNoteOptions?: { enabled: boolean; limit: number; price: number };
  alt?: string;
  sku?: string;
  availableSizes?: string[];
  weight?: string;
  dimensions?: string;
  tags?: string[];
};

// ── Preset Templates ────────────────────────────────────────────────────────
const PRODUCT_TEMPLATES = [
  {
    id: "solitaire-ring",
    name: "Solitaire Gold Ring Preset",
    type: "Ring",
    material: "18K Yellow Gold",
    price: 450,
    originalPrice: 600,
    description: "Handcrafted architectural solitaire ring in 18K yellow gold with refined symmetry.",
    layoutStyle: "2x2" as const,
    availableSizes: ["5", "6", "7", "8"],
    engravingEnabled: true,
    giftNoteEnabled: true,
  },
  {
    id: "diamond-necklace",
    name: "Diamond Pendant Necklace Preset",
    type: "Necklace",
    material: "Natural Diamond & Platinum",
    price: 890,
    originalPrice: 1100,
    description: "Luminous diamond pendant suspended on a fine platinum chain.",
    layoutStyle: "asymmetric" as const,
    availableSizes: [],
    engravingEnabled: false,
    giftNoteEnabled: true,
  },
  {
    id: "tennis-bracelet",
    name: "Bespoke Tennis Bracelet Preset",
    type: "Bracelet",
    material: "18K White Gold",
    price: 1250,
    originalPrice: 1500,
    description: "Minimalist tennis bracelet engineered for fluid everyday elegance.",
    layoutStyle: "2x2" as const,
    availableSizes: ["6.5", "7", "7.5"],
    engravingEnabled: true,
    giftNoteEnabled: true,
  }
];

// ── SKU generator ─────────────────────────────────────────────────────────────
const generateSKU = (type: string, collection: string) => {
  const t = (type || "XX").slice(0, 2).toUpperCase();
  const c = (collection || "XX").slice(0, 2).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VRX-${t}${c}-${rand}`;
};

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const paramDrawer = searchParams.get("drawer");
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollection, setFilterCollection] = useState("All");
  const [filterVisibility, setFilterVisibility] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [collectionOptions, setCollectionOptions] = useState(DEFAULT_COLLECTIONS);
  const [collectionLabels, setCollectionLabels] = useState<Record<string, string>>(DEFAULT_COLLECTION_LABELS);
  const [activeFormTab, setActiveFormTab] = useState<FormTab>("Core");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form fields
  const [fTitle, setFTitle] = useState("");
  const [fSku, setFSku] = useState("");
  const [fMaterial, setFMaterial] = useState("");
  const [fType, setFType] = useState("Ring");
  const [fPrice, setFPrice] = useState(0);
  const [fOriginalPrice, setFOriginalPrice] = useState<number | "">(0);
  const [fLayoutStyle, setFLayoutStyle] = useState<"2x2" | "asymmetric">("2x2");
  const [fImage, setFImage] = useState("");
  const [fImages, setFImages] = useState<string[]>([]);
  const [fDescription, setFDescription] = useState("");
  const [fCollection, setFCollection] = useState("");
  const [fStock, setFStock] = useState(999);
  const [fVisible, setFVisible] = useState(true);
  const [fVrixPlusExclusive, setFVrixPlusExclusive] = useState(false);
  const [fVrixPlusPrice, setFVrixPlusPrice] = useState(0);
  const [fEngravingEnabled, setFEngravingEnabled] = useState(false);
  const [fEngravingLimit, setFEngravingLimit] = useState(25);
  const [fEngravingPrice, setFEngravingPrice] = useState(0);
  const [fGiftNoteEnabled, setFGiftNoteEnabled] = useState(false);
  const [fGiftNoteLimit, setFGiftNoteLimit] = useState(120);
  const [fGiftNotePrice, setFGiftNotePrice] = useState(0);
  const [fAlt, setFAlt] = useState("");
  const [fWeight, setFWeight] = useState("");
  const [fDimensions, setFDimensions] = useState("");
  const [fAvailableSizes, setFAvailableSizes] = useState<string[]>([]);
  const [fTags, setFTags] = useState<string[]>([]);
  const [fTagInput, setFTagInput] = useState("");

  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
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
        const ids = collections.map((c: any) => String(c.id || "").trim()).filter(Boolean);
        const labels = collections.reduce((acc: Record<string, string>, c: any) => {
          const id = String(c.id || "").trim();
          if (id) acc[id] = c.title || id;
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
      .map((url) => url.trim()).filter(Boolean);
    return Array.from(new Set(urls));
  };

  const resetForm = () => {
    setFTitle(""); setFSku(""); setFMaterial(""); setFType("Ring");
    setFPrice(0); setFOriginalPrice(0); setFLayoutStyle("2x2");
    setFImage(""); setFImages([]); setFDescription("");
    setFCollection(""); setFStock(999); setFVisible(true);
    setFVrixPlusExclusive(false); setFVrixPlusPrice(0);
    setFEngravingEnabled(false); setFEngravingLimit(25); setFEngravingPrice(0);
    setFGiftNoteEnabled(false); setFGiftNoteLimit(120); setFGiftNotePrice(0);
    setFAlt(""); setFWeight(""); setFDimensions(""); setFAvailableSizes([]); setFTags([]);
    setActiveFormTab("Core"); setDeleteConfirm(false);
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setIsNew(false);
    setFTitle(p.title || ""); setFSku(p.sku || ""); setFMaterial(p.material || "");
    setFType(p.type || "Ring"); setFPrice(p.price || 0);
    setFOriginalPrice(p.originalPrice || 0);
    setFLayoutStyle(p.layoutStyle === "asymmetric" ? "asymmetric" : "2x2");
    setFImage(p.image || "");
    setFImages(normalizeImages(p.image || "", p.images));
    setFDescription(p.description || "");
    setFCollection(p.collection || "");
    setFStock(p.stock ?? 999); setFVisible(p.isVisible !== false);
    setFVrixPlusExclusive(!!p.isVrixPlusExclusive);
    setFVrixPlusPrice(p.vrixPlusPrice || 0);
    setFEngravingEnabled(p.engravingOptions?.enabled || false);
    setFEngravingLimit(p.engravingOptions?.limit || 25);
    setFEngravingPrice(p.engravingOptions?.price || 0);
    setFGiftNoteEnabled(p.giftNoteOptions?.enabled || false);
    setFGiftNoteLimit(p.giftNoteOptions?.limit || 120);
    setFGiftNotePrice(p.giftNoteOptions?.price || 0);
    setFAlt(p.alt || ""); setFWeight(p.weight || ""); setFDimensions(p.dimensions || "");
    setFAvailableSizes(p.availableSizes || []); setFTags(p.tags || []);
    setActiveFormTab("Core"); setDeleteConfirm(false);
  };

  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTmplName, setNewTmplName] = useState("");
  const [newTmplType, setNewTmplType] = useState("Ring");
  const [newTmplMaterial, setNewTmplMaterial] = useState("18K Yellow Gold");
  const [newTmplPrice, setNewTmplPrice] = useState<number | "">(500);
  const [newTmplDesc, setNewTmplDesc] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix_product_templates");
      if (saved) setCustomTemplates(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const allTemplates = [...PRODUCT_TEMPLATES, ...customTemplates];

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = allTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setFTitle((prev) => prev || tmpl.name);
    setFType(tmpl.type || "Ring");
    setFMaterial(tmpl.material || "");
    setFPrice(tmpl.price || 0);
    setFOriginalPrice(tmpl.originalPrice || 0);
    setFDescription(tmpl.description || "");
    setFLayoutStyle(tmpl.layoutStyle || "2x2");
    setFAvailableSizes(tmpl.availableSizes || []);
    setFEngravingEnabled(!!tmpl.engravingEnabled);
    setFGiftNoteEnabled(!!tmpl.giftNoteEnabled);
    showToast(`Applied preset: "${tmpl.name}"`);
  };

  const handleSaveCurrentAsTemplate = () => {
    const name = window.prompt("Enter a name for this product template:", fTitle || "Custom Product Template");
    if (!name || !name.trim()) return;
    const newTmpl = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      type: fType || "Jewelry",
      material: fMaterial || "18K Gold",
      price: fPrice || 0,
      originalPrice: fOriginalPrice || 0,
      description: fDescription || "",
      layoutStyle: fLayoutStyle || "2x2",
      availableSizes: fAvailableSizes || [],
      engravingEnabled: fEngravingEnabled,
      giftNoteEnabled: fGiftNoteEnabled,
      isCustom: true
    };
    const updated = [...customTemplates, newTmpl];
    setCustomTemplates(updated);
    try { localStorage.setItem("vrix_product_templates", JSON.stringify(updated)); } catch (e) {}
    showToast(`Saved template "${name.trim()}"`);
  };

  const handleCreateManualTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmplName.trim()) return;
    const newTmpl = {
      id: `custom-${Date.now()}`,
      name: newTmplName.trim(),
      type: newTmplType,
      material: newTmplMaterial,
      price: Number(newTmplPrice) || 0,
      originalPrice: 0,
      description: newTmplDesc.trim(),
      layoutStyle: "2x2",
      availableSizes: [],
      engravingEnabled: true,
      giftNoteEnabled: true,
      isCustom: true
    };
    const updated = [...customTemplates, newTmpl];
    setCustomTemplates(updated);
    try { localStorage.setItem("vrix_product_templates", JSON.stringify(updated)); } catch (e) {}
    setNewTmplName(""); setNewTmplDesc("");
    showToast(`Created template "${newTmpl.name}"`);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    try { localStorage.setItem("vrix_product_templates", JSON.stringify(updated)); } catch (e) {}
    showToast("Template deleted");
  };

  const handleNewProduct = () => {
    setSelectedProduct(null); setIsNew(true);
    resetForm();
  };

  useEffect(() => { loadProducts(); loadCollections(); }, []);

  useEffect(() => {
    if (loading || products.length === 0) return;
    if (paramId) {
      const match = products.find(p => p.id === paramId);
      if (match) selectProduct(match);
    } else if (paramDrawer === "new") {
      handleNewProduct();
    }
  }, [paramId, paramDrawer, products, loading]);

  // ── Image handlers ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadLoading(true);
    try {
      const result = await uploadMediaMultiple(files);
      const uploadedUrls = result.results
        .filter((item) => item.success && item.url)
        .map((item) => item.url as string);
      if (uploadedUrls.length === 0) throw new Error(result.results.find((i) => i.error)?.error || "No images uploaded");
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
    const next = fImages.filter((img) => img !== url);
    setFImages(next);
    if (fImage === url) setFImage(next[0] || "");
  };

  const handleSetCoverImage = (url: string) => {
    setFImage(url);
    setFImages(normalizeImages(url, fImages));
  };

  // Drag-reorder images
  const handleImageDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("imgIdx", String(idx));
  };
  const handleImageDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleImageDrop = (e: React.DragEvent, targetIdx: number) => {
    const srcIdx = parseInt(e.dataTransfer.getData("imgIdx"));
    if (isNaN(srcIdx) || srcIdx === targetIdx) { setDragOverIndex(null); return; }
    const next = [...fImages];
    const [moved] = next.splice(srcIdx, 1);
    next.splice(targetIdx, 0, moved);
    setFImages(next);
    if (fImage === fImages[srcIdx]) setFImage(next[0]);
    setDragOverIndex(null);
  };

  // ── Tags ────────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = fTagInput.trim().toLowerCase();
    if (t && !fTags.includes(t)) setFTags([...fTags, t]);
    setFTagInput("");
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const productImages = normalizeImages(fImage, fImages);
    if (!fTitle.trim() || fPrice === undefined || fPrice === null || isNaN(Number(fPrice)) || Number(fPrice) < 0 || productImages.length === 0) {
      showToast("Title, price, and at least one image are required.", "err");
      setActiveFormTab("Core");
      return;
    }
    setSaveLoading(true);
    const prodData = {
      title: fTitle, sku: fSku || generateSKU(fType, fCollection),
      material: fMaterial, type: fType,
      price: Number(fPrice),
      originalPrice: fOriginalPrice ? Number(fOriginalPrice) : undefined,
      layoutStyle: fLayoutStyle,
      image: fImage || productImages[0], images: productImages,
      description: fDescription, collection: fCollection || undefined,
      stock: Number(fStock), isVisible: fVisible,
      isVrixPlusExclusive: fVrixPlusExclusive,
      vrixPlusPrice: Number(fVrixPlusPrice) || undefined,
      engravingOptions: { enabled: fEngravingEnabled, limit: fEngravingLimit, price: fEngravingPrice },
      giftNoteOptions: { enabled: fGiftNoteEnabled, limit: fGiftNoteLimit, price: fGiftNotePrice },
      alt: fAlt || `A minimalist architectural ${fType} by VRIX from the ${collectionLabels[fCollection] || fCollection} collection.`,
      weight: fWeight, dimensions: fDimensions,
      availableSizes: fAvailableSizes,
      tags: fTags,
    };
    try {
      if (isNew) {
        const created = await createProduct(prodData);
        showToast(`Created "${created.title}"`);
        setIsNew(false);
        setSelectedProduct(created);
      } else if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, prodData);
        showToast(`Saved "${updated.title}"`);
      }
      loadProducts();
    } catch (err: any) {
      showToast("Error: " + err.message, "err");
    } finally { setSaveLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedProduct || isNew) return;
    if (!deleteConfirm) { setDeleteConfirm(true); setTimeout(() => setDeleteConfirm(false), 4000); return; }
    setSaveLoading(true);
    try {
      await deleteProduct(selectedProduct.id);
      showToast("Product deleted.");
      setSelectedProduct(null); setIsNew(false);
      loadProducts();
    } catch (err: any) {
      showToast("Error: " + err.message, "err");
    } finally { setSaveLoading(false); setDeleteConfirm(false); }
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

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collection?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCol = filterCollection === "All" || p.collection === filterCollection;
    const matchVis = filterVisibility === "All" ? true
      : filterVisibility === "visible" ? p.isVisible !== false : p.isVisible === false;
    const matchType = filterType === "All" || p.type === filterType;
    return matchSearch && matchCol && matchVis && matchType;
  });

  const stockBadge = (stock: number | undefined) => {
    const s = stock ?? 999;
    if (s === 0) return "bg-red-50 text-red-700 border-red-200";
    if (s <= 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const stockLabel = (stock: number | undefined) => {
    const s = stock ?? 999;
    if (s === 0) return "Out";
    if (s === 999) return "∞";
    return `${s}`;
  };

  const isEditing = selectedProduct || isNew;
  const totalVisible = products.filter((p) => p.isVisible !== false).length;
  const totalOutOfStock = products.filter((p) => (p.stock ?? 999) === 0).length;

  return (
    <div className="w-full min-h-screen bg-soft-linen/30">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md rounded ${toast.type === "ok" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"}`}>
          <span className="material-symbols-outlined text-base">{toast.type === "ok" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-6">

        {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-grey/20 pb-6">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wider">Product Catalogue</h1>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="text-slate-grey font-body-md text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-grey/40 inline-block" />
                {products.length} total
              </span>
              <span className="text-emerald-700 font-body-md text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {totalVisible} live
              </span>
              {totalOutOfStock > 0 && (
                <span className="text-red-700 font-body-md text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  {totalOutOfStock} out of stock
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="font-button text-button uppercase px-4 py-3 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-white transition-colors cursor-pointer flex items-center gap-2 shrink-0 rounded"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
              Manage Templates ({allTemplates.length})
            </button>
            <button
              onClick={handleNewProduct}
              className="font-button text-button uppercase px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center gap-2 shrink-0 rounded"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Product
            </button>
          </div>
        </div>

        {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* LEFT: Product List */}
          <div className={`xl:col-span-4 flex flex-col gap-3 ${isEditing ? "xl:col-span-4" : "xl:col-span-12"}`}>

            {/* Filters */}
            <div className="bg-pure-white border border-slate-grey/20 p-3 shadow-sm flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[140px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-grey text-[15px]">search</span>
                <input
                  type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, SKU, material..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-grey/25 focus:border-deep-navy outline-none font-body-md bg-transparent"
                />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-2.5 py-2 text-xs border border-slate-grey/25 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                <option value="All">All Types</option>
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)} className="px-2.5 py-2 text-xs border border-slate-grey/25 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                <option value="All">All Collections</option>
                {collectionOptions.map((c) => <option key={c} value={c}>{collectionLabels[c] || c}</option>)}
              </select>
              <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="px-2.5 py-2 text-xs border border-slate-grey/25 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                <option value="All">All</option>
                <option value="visible">Live</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">{filteredProducts.length} results</span>
            </div>

            {/* Product List */}
            {loading ? (
              <div className="bg-pure-white border border-slate-grey/20 h-48 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
                Loading Inventory...
              </div>
            ) : (
              <div className="bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-grey/8 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id && !isNew;
                    return (
                      <div
                        key={p.id}
                        onClick={() => selectProduct(p)}
                        className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer group ${isSelected ? "bg-deep-navy/5 border-l-[3px] border-deep-navy" : "hover:bg-soft-linen/30 border-l-[3px] border-transparent"}`}
                      >
                        {/* Image */}
                        <div className="w-11 h-14 relative bg-soft-linen overflow-hidden shrink-0 border border-slate-grey/10">
                          <Image src={p.image} alt={p.title} fill className="object-cover mix-blend-multiply" sizes="44px"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80"; }} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body-md text-sm text-ink-black truncate font-medium leading-snug">{p.title}</h4>
                          <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-wider truncate">
                            {collectionLabels[p.collection || ""] || p.collection || "No Collection"} · {p.type}
                          </p>
                          {p.sku && <p className="text-[9px] text-slate-grey/60 font-mono truncate">{p.sku}</p>}
                          <p className="text-xs text-deep-navy font-semibold mt-0.5">${p.price?.toLocaleString()}</p>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-0.5 border rounded-full ${stockBadge(p.stock)}`}>
                            {stockLabel(p.stock)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(p); }}
                            className={`flex items-center gap-0.5 text-[9px] font-label-caps uppercase tracking-widest transition-colors cursor-pointer ${p.isVisible !== false ? "text-emerald-700" : "text-slate-grey/50"}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{p.isVisible !== false ? "visibility" : "visibility_off"}</span>
                            {p.isVisible !== false ? "Live" : "Off"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="p-12 text-center">
                      <span className="material-symbols-outlined text-3xl text-slate-grey/30">inventory_2</span>
                      <p className="text-slate-grey text-xs font-label-caps uppercase tracking-widest mt-2">No products match filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Editor Panel */}
          {isEditing && (
            <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Form */}
              <div className="lg:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm flex flex-col">

                {/* Editor Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-grey/15">
                  <div>
                    <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                      {isNew ? "New Product" : "Editing Product"}
                    </h2>
                    {!isNew && selectedProduct && (
                      <p className="text-[10px] text-slate-grey mt-0.5 font-mono">{selectedProduct.id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isNew && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className={`text-[10px] font-label-caps uppercase flex items-center gap-1 cursor-pointer px-3 py-1.5 border rounded transition-all ${
                          deleteConfirm
                            ? "bg-red-600 text-white border-red-600"
                            : "text-red-600 border-red-200 hover:bg-red-50"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        {deleteConfirm ? "Confirm Delete?" : "Delete"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSelectedProduct(null); setIsNew(false); }}
                      className="text-slate-grey hover:text-ink-black p-1.5 rounded hover:bg-soft-linen/50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Form Tabs */}
                <div className="flex border-b border-slate-grey/15">
                  {FORM_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveFormTab(tab)}
                      className={`flex-1 py-3 px-2 font-label-caps text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                        activeFormTab === tab
                          ? "text-deep-navy border-b-2 border-deep-navy bg-soft-linen/20"
                          : "text-slate-grey hover:text-ink-black hover:bg-soft-linen/10"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">

                  {/* ── CORE TAB ─────────────────────────────────────────── */}
                  {activeFormTab === "Core" && (
                    <div className="space-y-5">

                      {/* Quick Presets / Product Templates */}
                      <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-label-caps text-[9px] text-amber-900 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">dashboard_customize</span>
                            Product Preset Templates
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowTemplateModal(true)}
                            className="text-[10px] text-amber-900 font-semibold underline hover:text-black flex items-center gap-0.5"
                          >
                            Manage All ({allTemplates.length})
                          </button>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleApplyTemplate(e.target.value);
                          }}
                          defaultValue=""
                          className="w-full bg-pure-white border border-amber-300/80 py-1.5 px-2 font-body-md text-xs text-ink-black rounded outline-none cursor-pointer"
                        >
                          <option value="" disabled>Choose a pre-made product preset template...</option>
                          {allTemplates.map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id}>
                              {tmpl.name} ({tmpl.material} • ${tmpl.price}) {tmpl.isCustom ? "⭐ Custom" : ""}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                          <p className="text-[9px] text-amber-800/70">
                            Pre-fills type, material, sizes & pricing.
                          </p>
                          <button
                            type="button"
                            onClick={handleSaveCurrentAsTemplate}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">bookmark_add</span>
                            Save Form as Template
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">title</span>
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text" value={fTitle}
                          onChange={(e) => setFTitle(e.target.value)}
                          required placeholder="e.g. Cira Oval Solitaire Ring"
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent placeholder:text-slate-grey/40"
                        />
                      </div>

                      {/* PC Image Layout Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">grid_view</span>
                          PC Desktop Image View Grid Style
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFLayoutStyle("2x2")}
                            className={`p-2.5 border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              fLayoutStyle === "2x2"
                                ? "border-deep-navy bg-deep-navy/5 text-deep-navy font-semibold"
                                : "border-slate-grey/25 text-slate-grey hover:border-slate-grey"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">grid_view</span>
                            <div>
                              <span className="font-label-caps text-[10px] uppercase block">2×2 Square Grid</span>
                              <span className="text-[9px] font-normal text-slate-grey">4 equal image tiles</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFLayoutStyle("asymmetric")}
                            className={`p-2.5 border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              fLayoutStyle === "asymmetric"
                                ? "border-deep-navy bg-deep-navy/5 text-deep-navy font-semibold"
                                : "border-slate-grey/25 text-slate-grey hover:border-slate-grey"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">dashboard</span>
                            <div>
                              <span className="font-label-caps text-[10px] uppercase block">Asymmetric Grid</span>
                              <span className="text-[9px] font-normal text-slate-grey">1 Tall Left + 2 Right + 3 Bottom</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* SKU */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">tag</span>
                            SKU
                          </span>
                          <button
                            type="button"
                            onClick={() => setFSku(generateSKU(fType, fCollection))}
                            className="text-deep-navy text-[9px] hover:underline cursor-pointer"
                          >
                            Auto-generate
                          </button>
                        </label>
                        <input
                          type="text" value={fSku}
                          onChange={(e) => setFSku(e.target.value)}
                          placeholder="VRX-RI-0000 (auto-generated on save if empty)"
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-slate-grey bg-transparent font-mono placeholder:text-slate-grey/30"
                        />
                      </div>

                      {/* Type + Collection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">category</span>
                            Type
                          </label>
                          <select value={fType} onChange={(e) => setFType(e.target.value)} className="border-b border-slate-grey/30 py-1.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">folder</span>
                            Collection
                          </label>
                          <select value={fCollection} onChange={(e) => setFCollection(e.target.value)} className="border-b border-slate-grey/30 py-1.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                            <option value="">No Collection</option>
                            {collectionOptions.map((c) => <option key={c} value={c}>{collectionLabels[c] || c}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Material */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">diamond</span>
                          Material
                        </label>
                        <input
                          list="material-presets"
                          type="text" value={fMaterial}
                          onChange={(e) => setFMaterial(e.target.value)}
                          placeholder="e.g. 18K Yellow Gold"
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent placeholder:text-slate-grey/40"
                        />
                        <datalist id="material-presets">
                          {MATERIAL_PRESETS.map((m) => <option key={m} value={m} />)}
                        </datalist>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">description</span>
                            Description
                          </span>
                          <span className={`text-[9px] ${fDescription.length > 400 ? "text-amber-600" : "text-slate-grey/50"}`}>
                            {fDescription.length}/500
                          </span>
                        </label>
                        <textarea
                          rows={4} value={fDescription}
                          onChange={(e) => setFDescription(e.target.value.slice(0, 500))}
                          placeholder="A sculptural meditation on form and light..."
                          className="border border-slate-grey/25 p-2.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black resize-none text-xs placeholder:text-slate-grey/40"
                        />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">label</span>
                          Tags
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text" value={fTagInput}
                            onChange={(e) => setFTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                            placeholder="e.g. minimalist, gifting…"
                            className="flex-1 border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs bg-transparent placeholder:text-slate-grey/30"
                          />
                          <button type="button" onClick={addTag} className="text-deep-navy text-[10px] font-label-caps uppercase px-2 hover:underline cursor-pointer">Add</button>
                        </div>
                        {fTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {fTags.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 text-[10px] bg-soft-linen border border-slate-grey/20 px-2 py-0.5 font-label-caps uppercase tracking-wider text-ink-black">
                                {tag}
                                <button type="button" onClick={() => setFTags(fTags.filter((t) => t !== tag))} className="text-slate-grey hover:text-red-500 cursor-pointer text-[10px]">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Alt Text */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">alt_route</span>
                          Image Alt Text (SEO)
                        </label>
                        <input
                          type="text" value={fAlt}
                          onChange={(e) => setFAlt(e.target.value)}
                          placeholder="Descriptive alt text for accessibility & SEO"
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black bg-transparent placeholder:text-slate-grey/40"
                        />
                      </div>

                      {/* Physical details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Weight (g)</label>
                          <input type="text" value={fWeight} onChange={(e) => setFWeight(e.target.value)} placeholder="e.g. 4.2g" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs bg-transparent placeholder:text-slate-grey/40" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Dimensions</label>
                          <input type="text" value={fDimensions} onChange={(e) => setFDimensions(e.target.value)} placeholder="e.g. 12×8×3mm" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs bg-transparent placeholder:text-slate-grey/40" />
                        </div>
                      </div>

                      {/* Ring Sizes */}
                      {(fType === "Ring" || fType === "Bracelet" || fType === "Cuff" || fType === "Anklet") && (
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Available Sizes</label>
                          <div className="flex flex-wrap gap-1.5">
                            {RING_SIZES.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setFAvailableSizes((prev) =>
                                  prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                                )}
                                className={`w-9 h-9 text-[10px] font-label-caps border cursor-pointer transition-all ${
                                  fAvailableSizes.includes(size)
                                    ? "bg-deep-navy text-pure-white border-deep-navy"
                                    : "bg-pure-white text-slate-grey border-slate-grey/25 hover:border-slate-grey/50"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── MEDIA TAB ──────────────────────────────────────────── */}
                  {activeFormTab === "Media" && (
                    <div className="space-y-5">
                      {/* URL input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Cover Image URL</label>
                        <input
                          type="url" value={fImage}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          placeholder="https://..."
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black bg-transparent placeholder:text-slate-grey/40"
                        />
                      </div>

                      {/* Upload */}
                      <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="prod-img-upload" />
                        <label
                          htmlFor="prod-img-upload"
                          className={`inline-flex items-center gap-2 font-button text-[10px] uppercase px-4 py-2.5 border border-slate-grey/30 text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer ${uploadLoading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {uploadLoading
                            ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[15px]">upload</span>}
                          {uploadLoading ? "Uploading..." : "Upload Images"}
                        </label>
                        <span className="text-[10px] text-slate-grey/60">JPG · PNG · WebP · Multiple allowed</span>
                      </div>

                      {/* Image Gallery – drag to reorder */}
                      {fImages.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-grey/60 font-label-caps uppercase tracking-widest">
                            Drag to reorder · Click thumbnail to set cover
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {fImages.map((url, idx) => (
                              <div
                                key={url}
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, idx)}
                                onDragOver={(e) => handleImageDragOver(e, idx)}
                                onDrop={(e) => handleImageDrop(e, idx)}
                                onDragLeave={() => setDragOverIndex(null)}
                                className={`relative aspect-square bg-soft-linen border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                                  url === fImage ? "border-deep-navy shadow-md" : "border-transparent hover:border-slate-grey/30"
                                } ${dragOverIndex === idx ? "border-dashed border-deep-navy/60 scale-95" : ""}`}
                              >
                                <button type="button" onClick={() => handleSetCoverImage(url)} className="absolute inset-0 z-10 cursor-pointer" aria-label="Set cover" />
                                <Image src={url} alt={`Gallery ${idx + 1}`} fill className="object-cover mix-blend-multiply" sizes="120px"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120"; }} />
                                {url === fImage && (
                                  <span className="absolute left-1.5 bottom-1.5 z-20 bg-deep-navy text-pure-white text-[8px] font-label-caps uppercase px-1.5 py-0.5 rounded-sm">Cover</span>
                                )}
                                <span className="absolute top-1.5 left-1.5 z-20 bg-black/40 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                  {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(url)}
                                  className="absolute right-1.5 top-1.5 z-20 w-5 h-5 bg-pure-white/90 border border-slate-grey/30 text-ink-black flex items-center justify-center cursor-pointer hover:bg-red-50 hover:text-red-600 rounded-sm"
                                  aria-label="Remove"
                                >
                                  <span className="material-symbols-outlined text-[11px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-grey/20 rounded p-8 text-center">
                          <span className="material-symbols-outlined text-3xl text-slate-grey/30">add_photo_alternate</span>
                          <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-widest mt-2">No images yet</p>
                          <p className="text-[10px] text-slate-grey/50 mt-1">Upload or paste a URL above</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PRICING TAB ──────────────────────────────────────── */}
                  {activeFormTab === "Pricing" && (
                    <div className="space-y-5">

                      {/* Price & Discount */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">local_offer</span>
                            Selling Price (With Discount) <span className="text-red-500">*</span>
                          </label>
                          <input type="number" value={fPrice} onChange={(e) => setFPrice(Number(e.target.value))} min={0} required className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">sell</span>
                            Original Strikethrough Price (Without Discount)
                          </label>
                          <input
                            type="number"
                            value={fOriginalPrice === "" ? "" : fOriginalPrice}
                            onChange={(e) => setFOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Optional original MRP price"
                            min={0}
                            className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent placeholder:text-slate-grey/40"
                          />
                        </div>
                      </div>

                      {/* Discount Preview Badge */}
                      {Number(fOriginalPrice) > Number(fPrice) && Number(fPrice) > 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-label-caps">
                          <span>
                            Discount Active: Save {formatPrice(Number(fOriginalPrice) - Number(fPrice))}
                          </span>
                          <span className="bg-emerald-600 text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                            {Math.round(((Number(fOriginalPrice) - Number(fPrice)) / Number(fOriginalPrice)) * 100)}% OFF
                          </span>
                        </div>
                      )}

                      {/* Stock */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                          Stock Units
                        </label>
                        <input type="number" value={fStock} onChange={(e) => setFStock(Number(e.target.value))} min={0} className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                        <p className="text-[9px] text-slate-grey/60">999 = unlimited stock</p>
                      </div>

                      {/* Visibility */}
                      <div className="flex items-center justify-between p-4 border border-slate-grey/20 bg-soft-linen/20 rounded">
                        <div>
                          <p className="font-label-caps text-[10px] text-ink-black uppercase tracking-widest">Storefront Visibility</p>
                          <p className="text-[10px] text-slate-grey mt-0.5">{fVisible ? "Live on store — customers can see this" : "Hidden — not visible to customers"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFVisible(!fVisible)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fVisible ? "bg-emerald-500" : "bg-slate-grey/30"}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${fVisible ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* VRIX+ Exclusive */}
                      <div className={`p-4 border space-y-4 rounded ${fVrixPlusExclusive ? "border-amber-300 bg-amber-50/40" : "border-slate-grey/20 bg-soft-linen/10"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor="vrix-plus-toggle" className="font-label-caps text-[10px] text-deep-navy uppercase tracking-widest font-semibold flex items-center gap-1.5 cursor-pointer">
                              <span className="material-symbols-outlined text-amber-500 text-[14px]">stars</span>
                              VRIX+ Member Exclusive
                            </label>
                            <p className="text-[10px] text-slate-grey mt-0.5">Lock item for VRIX+ Circle members only</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFVrixPlusExclusive(!fVrixPlusExclusive)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fVrixPlusExclusive ? "bg-amber-500" : "bg-slate-grey/30"}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${fVrixPlusExclusive ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>
                        {fVrixPlusExclusive && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-amber-200/60">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Member-Only Price (USD) — Optional</label>
                            <input
                              type="number" value={fVrixPlusPrice}
                              onChange={(e) => setFVrixPlusPrice(Number(e.target.value))}
                              placeholder="0 = use standard price"
                              min={0}
                              className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── CUSTOMIZATIONS TAB ───────────────────────────────── */}
                  {activeFormTab === "Customizations" && (
                    <div className="space-y-5">

                      {/* Engraving */}
                      <div className={`p-4 border space-y-4 rounded ${fEngravingEnabled ? "border-deep-navy/30 bg-deep-navy/3" : "border-slate-grey/20"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-label-caps text-[10px] text-ink-black uppercase tracking-widest flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">edit_square</span>
                              Engraving Option
                            </label>
                            <p className="text-[10px] text-slate-grey mt-0.5">Customers can add personalized text</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFEngravingEnabled(!fEngravingEnabled)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fEngravingEnabled ? "bg-deep-navy" : "bg-slate-grey/30"}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${fEngravingEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>
                        {fEngravingEnabled && (
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-grey/15">
                            <div className="flex flex-col gap-1.5">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Max Characters</label>
                              <input type="number" value={fEngravingLimit} onChange={(e) => setFEngravingLimit(Number(e.target.value))} min={1} className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent font-body-md" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Extra Charge (USD)</label>
                              <input type="number" value={fEngravingPrice} onChange={(e) => setFEngravingPrice(Number(e.target.value))} min={0} className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent font-body-md" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gift Note */}
                      <div className={`p-4 border space-y-4 rounded ${fGiftNoteEnabled ? "border-deep-navy/30 bg-deep-navy/3" : "border-slate-grey/20"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-label-caps text-[10px] text-ink-black uppercase tracking-widest flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">card_membership</span>
                              Gift Note
                            </label>
                            <p className="text-[10px] text-slate-grey mt-0.5">Allow a personal message with the order</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFGiftNoteEnabled(!fGiftNoteEnabled)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fGiftNoteEnabled ? "bg-deep-navy" : "bg-slate-grey/30"}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${fGiftNoteEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>
                        {fGiftNoteEnabled && (
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-grey/15">
                            <div className="flex flex-col gap-1.5">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Max Characters</label>
                              <input type="number" value={fGiftNoteLimit} onChange={(e) => setFGiftNoteLimit(Number(e.target.value))} min={1} className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent font-body-md" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Extra Charge (USD)</label>
                              <input type="number" value={fGiftNotePrice} onChange={(e) => setFGiftNotePrice(Number(e.target.value))} min={0} className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent font-body-md" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary of active customizations */}
                      <div className="text-[10px] text-slate-grey space-y-1 bg-soft-linen/40 p-3 rounded border border-slate-grey/15">
                        <p className="font-label-caps uppercase tracking-widest text-deep-navy mb-2">Active Customizations</p>
                        <div className={`flex items-center gap-1.5 ${fEngravingEnabled ? "text-emerald-700" : "text-slate-grey/40"}`}>
                          <span className="material-symbols-outlined text-[12px]">{fEngravingEnabled ? "check_circle" : "radio_button_unchecked"}</span>
                          Engraving {fEngravingEnabled ? `(up to ${fEngravingLimit} chars · $${fEngravingPrice})` : "disabled"}
                        </div>
                        <div className={`flex items-center gap-1.5 ${fGiftNoteEnabled ? "text-emerald-700" : "text-slate-grey/40"}`}>
                          <span className="material-symbols-outlined text-[12px]">{fGiftNoteEnabled ? "check_circle" : "radio_button_unchecked"}</span>
                          Gift Note {fGiftNoteEnabled ? `(up to ${fGiftNoteLimit} chars · $${fGiftNotePrice})` : "disabled"}
                        </div>
                        <div className={`flex items-center gap-1.5 ${fAvailableSizes.length > 0 ? "text-emerald-700" : "text-slate-grey/40"}`}>
                          <span className="material-symbols-outlined text-[12px]">{fAvailableSizes.length > 0 ? "check_circle" : "radio_button_unchecked"}</span>
                          Sizes {fAvailableSizes.length > 0 ? `(${fAvailableSizes.join(", ")})` : "not set"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SAVE BUTTON (always visible) ─────────────────────── */}
                  <div className="flex gap-3 pt-2 border-t border-slate-grey/10">
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="flex-1 font-button text-button uppercase py-3.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {saveLoading
                        ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                        : <><span className="material-symbols-outlined text-[16px]">{isNew ? "add_circle" : "save"}</span>{isNew ? "Create Product" : "Save Changes"}</>
                      }
                    </button>
                    {isNew && (
                      <button
                        type="button"
                        onClick={() => { setIsNew(false); setSelectedProduct(null); }}
                        className="px-4 font-button text-button uppercase border border-slate-grey/30 text-ink-black hover:border-ink-black transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Preview Panel */}
              <div className="lg:col-span-2 flex flex-col gap-4">

                {/* Live Card Preview */}
                <div className="bg-pure-white border border-slate-grey/20 shadow-sm p-4">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">preview</span>
                    Live Preview
                  </p>
                  <div className="aspect-[3/4] bg-soft-linen relative overflow-hidden mb-3">
                    {fImage ? (
                      <Image
                        src={fImage} alt={fAlt || fTitle || "Preview"}
                        fill className="object-cover mix-blend-multiply"
                        sizes="200px"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200"; }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-slate-grey/30">image</span>
                        <span className="text-[9px] text-slate-grey/50 font-label-caps uppercase tracking-wider">No image</span>
                      </div>
                    )}
                    {fVrixPlusExclusive && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-label-caps uppercase tracking-widest px-2 py-0.5">
                        VRIX+
                      </div>
                    )}
                    {fVisible === false && (
                      <div className="absolute bottom-2 right-2 bg-slate-grey text-white text-[8px] font-label-caps uppercase tracking-widest px-2 py-0.5">
                        Hidden
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{collectionLabels[fCollection] || fCollection || "No Collection"}</p>
                    <h3 className="font-body-md text-sm text-ink-black font-medium leading-snug">{fTitle || "Product Title"}</h3>
                    {fMaterial && <p className="text-[10px] text-slate-grey">{fMaterial}</p>}
                    <p className="text-deep-navy font-semibold text-sm">{fPrice ? `$${Number(fPrice).toLocaleString()}` : "$0"}</p>
                  </div>
                </div>

                {/* Product Meta Summary */}
                <div className="bg-pure-white border border-slate-grey/20 shadow-sm p-4 space-y-2">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-2">Product Summary</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Type", val: fType },
                      { label: "SKU", val: fSku || "Auto on save" },
                      { label: "Images", val: `${fImages.length} uploaded` },
                      { label: "Stock", val: fStock === 999 ? "Unlimited" : `${fStock} units` },
                      { label: "Sizes", val: fAvailableSizes.length > 0 ? fAvailableSizes.join(", ") : "—" },
                      { label: "Tags", val: fTags.length > 0 ? fTags.join(", ") : "—" },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-start gap-2">
                        <span className="text-[9px] text-slate-grey font-label-caps uppercase tracking-wider shrink-0">{label}</span>
                        <span className="text-[10px] text-ink-black font-body-md text-right break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                {!isNew && selectedProduct && (
                  <div className="bg-pure-white border border-slate-grey/20 shadow-sm p-4 space-y-2">
                    <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-2">Quick Actions</p>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(selectedProduct)}
                      className={`w-full flex items-center gap-2 py-2 px-3 border text-[10px] font-label-caps uppercase tracking-wider cursor-pointer transition-all ${
                        fVisible ? "border-slate-grey/20 text-slate-grey hover:border-deep-navy" : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{fVisible ? "visibility_off" : "visibility"}</span>
                      {fVisible ? "Hide from store" : "Publish to store"}
                    </button>
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] text-slate-grey font-label-caps uppercase tracking-widest shrink-0">Stock:</label>
                      <input
                        type="number" value={fStock} min={0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFStock(val);
                          if (selectedProduct) handleStockChange(selectedProduct, val);
                        }}
                        className="flex-1 border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent font-body-md text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TEMPLATES MANAGER MODAL ────────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pure-white border border-slate-grey/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-grey/20 pb-4">
              <div>
                <h2 className="font-display-lg text-lg text-deep-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">dashboard_customize</span>
                  Product Preset Templates Manager
                </h2>
                <p className="text-xs text-slate-grey mt-0.5">Create, manage, apply, or delete product templates to speed up product entry.</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-grey hover:text-ink-black text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Create New Template Form */}
            <form onSubmit={handleCreateManualTemplate} className="p-4 bg-soft-linen/30 border border-slate-grey/20 rounded space-y-3">
              <h3 className="font-label-caps text-xs text-deep-navy uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Create New Custom Template
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-label-caps text-slate-grey uppercase">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Emerald Ring"
                    value={newTmplName}
                    onChange={(e) => setNewTmplName(e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-label-caps text-slate-grey uppercase">Category / Type</label>
                  <select
                    value={newTmplType}
                    onChange={(e) => setNewTmplType(e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-label-caps text-slate-grey uppercase">Default Material</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 18K Yellow Gold"
                    value={newTmplMaterial}
                    onChange={(e) => setNewTmplMaterial(e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-label-caps text-slate-grey uppercase">Default Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={newTmplPrice}
                    onChange={(e) => setNewTmplPrice(Number(e.target.value))}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-label-caps text-slate-grey uppercase">Default Description</label>
                  <input
                    type="text"
                    placeholder="Optional short template description"
                    value={newTmplDesc}
                    onChange={(e) => setNewTmplDesc(e.target.value)}
                    className="border-b border-slate-grey/30 py-1 text-xs outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-deep-navy text-white hover:bg-ink-black rounded text-xs font-button uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">save</span>
                  Save New Template
                </button>
              </div>
            </form>

            {/* List of Templates */}
            <div className="space-y-3">
              <h3 className="font-label-caps text-xs text-slate-grey uppercase tracking-wider font-semibold">
                Available Templates ({allTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {allTemplates.map((t) => (
                  <div key={t.id} className="p-3.5 border border-slate-grey/20 rounded bg-pure-white flex flex-col justify-between gap-3 hover:border-amber-400/60 transition-colors">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-body-md text-xs text-ink-black font-semibold">{t.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-label-caps uppercase ${t.isCustom ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                          {t.isCustom ? "Custom" : "Standard"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-grey mt-1">
                        {t.type} • {t.material} • <span className="font-semibold text-deep-navy">${t.price}</span>
                      </p>
                      {t.description && (
                        <p className="text-[10px] text-slate-grey/70 line-clamp-2 mt-1 italic">
                          "{t.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-grey/10">
                      <button
                        type="button"
                        onClick={() => {
                          handleApplyTemplate(t.id);
                          setShowTemplateModal(false);
                          if (!isEditing) handleNewProduct();
                        }}
                        className="px-2.5 py-1 bg-deep-navy text-white hover:bg-emerald-700 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">flash_on</span>
                        Apply to Form
                      </button>

                      {t.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="text-[10px] text-red-600 hover:text-red-800 font-medium flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete</span>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-grey/20 pt-4">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-5 py-2 border border-slate-grey/30 text-slate-grey hover:text-ink-black rounded text-xs font-button uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest uppercase">Loading Product Manager...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
