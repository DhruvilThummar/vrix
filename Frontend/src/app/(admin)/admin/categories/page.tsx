"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { fetchAllCategories, saveCategories, uploadMedia } from "@/utils/api";

interface Category {
  id: string;
  title: string;
  tagline?: string;
  image: string;
  link: string;
  isVisible?: boolean;
}

const DEFAULT_LINK_SUGGESTIONS = [
  "/products?type=necklace",
  "/products?type=earrings",
  "/products?type=bracelet",
  "/products?type=rings",
  "/products?type=charms",
  "/collections/silent-center",
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fId, setFId] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fTagline, setFTagline] = useState("");
  const [fImage, setFImage] = useState("");
  const [fLink, setFLink] = useState("/products?type=necklace");
  const [fVisible, setFVisible] = useState(true);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await fetchAllCategories();
      setCategories(cats.map((c: any) => ({ ...c, isVisible: c.isVisible !== false })));
    } catch {
      showToast("Failed to load categories.", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const selectCategory = (c: Category) => {
    setSelected(c);
    setIsNew(false);
    setFId(c.id);
    setFTitle(c.title);
    setFTagline(c.tagline || "");
    setFImage(c.image);
    setFLink(c.link);
    setFVisible(c.isVisible !== false);
  };

  const handleNew = () => {
    setSelected(null);
    setIsNew(true);
    setFId("");
    setFTitle("");
    setFTagline("");
    setFImage("");
    setFLink("/products?type=necklace");
    setFVisible(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const result = await uploadMedia(file);
      setFImage(result.url);
      showToast("Image uploaded.");
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "err");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveAll = async (updatedList: Category[]) => {
    setSaving(true);
    try {
      await saveCategories(updatedList);
      showToast("Categories saved.");
      setCategories(updatedList);
    } catch (err: any) {
      showToast("Save failed: " + err.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !fImage.trim()) {
      showToast("Title and image are required.", "err");
      return;
    }
    const id = fId.trim() || fTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const updated: Category = {
      id,
      title: fTitle,
      tagline: fTagline,
      image: fImage,
      link: fLink,
      isVisible: fVisible,
    };
    let newList: Category[];
    if (isNew) {
      newList = [...categories, updated];
    } else {
      newList = categories.map((c) => (c.id === selected?.id ? updated : c));
    }
    await saveAll(newList);
    await loadCategories();
    setIsNew(false);
    setSelected(updated);
  };

  const handleDelete = async () => {
    if (!selected || isNew) return;
    if (!confirm(`Delete category "${selected.title}"?`)) return;
    const newList = categories.filter((c) => c.id !== selected.id);
    await saveAll(newList);
    setSelected(null);
    await loadCategories();
  };

  const handleToggleVisibility = async (c: Category) => {
    const newList = categories.map((cat) =>
      cat.id === c.id ? { ...cat, isVisible: !c.isVisible } : cat
    );
    setCategories(newList);
    await saveAll(newList);
  };

  const handleReorder = (idx: number, dir: -1 | 1) => {
    const newList = [...categories];
    const target = idx + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    setCategories(newList);
    saveAll(newList);
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
            toast.type === "ok"
              ? "bg-deep-navy text-pure-white border-slate-grey/30"
              : "bg-red-900 text-white border-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {toast.type === "ok" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">
              Categories Manager
            </h1>
            <p className="text-slate-grey font-body-md text-sm mt-1">
              {categories.length} categories ·{" "}
              {categories.filter((c) => c.isVisible !== false).length} visible on store
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/categories"
              target="_blank"
              rel="noopener noreferrer"
              className="font-button text-[11px] uppercase px-5 py-3 border border-slate-grey/30 text-ink-black hover:border-deep-navy transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              View Page
            </a>
            <button
              onClick={handleNew}
              className="font-button text-[11px] uppercase px-5 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Category
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
            Loading categories...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Category List */}
            <div className="xl:col-span-2 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                  All Categories
                </h2>
              </div>
              <div className="divide-y divide-slate-grey/10 max-h-[620px] overflow-y-auto">
                {categories.length === 0 && (
                  <div className="p-8 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                    No categories yet. Add one.
                  </div>
                )}
                {categories.map((c, idx) => {
                  const isSelected = selected?.id === c.id && !isNew;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-soft-linen/40 border-l-2 border-deep-navy"
                          : "hover:bg-soft-linen/20"
                      }`}
                      onClick={() => selectCategory(c)}
                    >
                      {/* Image thumbnail */}
                      <div className="w-12 h-12 relative bg-soft-linen overflow-hidden shrink-0 border border-slate-grey/10 rounded">
                        {c.image && (
                          <Image
                            src={c.image}
                            alt={c.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-body-md text-ink-black font-medium truncate">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-wider truncate">
                          {c.tagline || c.link}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(c);
                          }}
                          className={`flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest cursor-pointer ${
                            c.isVisible !== false ? "text-green-700" : "text-slate-grey"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {c.isVisible !== false ? "visibility" : "visibility_off"}
                          </span>
                          {c.isVisible !== false ? "Live" : "Hidden"}
                        </button>
                        <div className="flex gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(idx, -1);
                            }}
                            disabled={idx === 0}
                            className="w-5 h-5 flex items-center justify-center border border-slate-grey/20 text-slate-grey hover:text-deep-navy disabled:opacity-30 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              arrow_upward
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(idx, 1);
                            }}
                            disabled={idx === categories.length - 1}
                            className="w-5 h-5 flex items-center justify-center border border-slate-grey/20 text-slate-grey hover:text-deep-navy disabled:opacity-30 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              arrow_downward
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="xl:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm p-6 overflow-y-auto max-h-[620px]">
              {!selected && !isNew ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-grey py-16">
                  <span className="material-symbols-outlined text-4xl">touch_app</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">
                    Select a category to edit
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  {/* Form header */}
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                    <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                      {isNew ? "New Category" : `Editing: ${selected?.title}`}
                    </h3>
                    {!isNew && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="text-[10px] font-label-caps uppercase text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Title + Slug */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={fTitle}
                        onChange={(e) => setFTitle(e.target.value)}
                        required
                        placeholder="Necklaces"
                        className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                        URL Slug (ID)
                      </label>
                      <input
                        type="text"
                        value={fId}
                        onChange={(e) => setFId(e.target.value)}
                        placeholder="necklaces"
                        className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-slate-grey bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                      Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={fTagline}
                      onChange={(e) => setFTagline(e.target.value)}
                      placeholder="e.g. For quiet elegance"
                      className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                    />
                  </div>

                  {/* Link */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={fLink}
                      onChange={(e) => setFLink(e.target.value)}
                      placeholder="/products?type=necklace"
                      className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                    />
                    {/* Quick-fill suggestions */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {DEFAULT_LINK_SUGGESTIONS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setFLink(l)}
                          className="text-[9px] font-label-caps px-2 py-0.5 border border-slate-grey/25 text-slate-grey hover:border-deep-navy hover:text-deep-navy cursor-pointer transition-colors"
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                      Category Image *
                    </label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={fImage}
                          onChange={(e) => setFImage(e.target.value)}
                          placeholder="https://... or upload below"
                          className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="cat-img-upload"
                          />
                          <label
                            htmlFor="cat-img-upload"
                            className={`inline-flex items-center gap-1.5 font-button text-[9px] uppercase px-3 py-1.5 border border-slate-grey/30 text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer ${
                              uploadLoading ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            {uploadLoading ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[12px]">upload</span>
                            )}
                            {uploadLoading ? "Uploading..." : "Upload Image"}
                          </label>
                        </div>
                      </div>
                      {fImage && (
                        <div className="w-20 h-20 relative bg-soft-linen overflow-hidden border border-slate-grey/15 shrink-0 rounded">
                          <Image
                            src={fImage}
                            alt="Preview"
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-grey/15">
                    <button
                      type="button"
                      onClick={() => setFVisible(!fVisible)}
                      className={`flex items-center gap-2 font-label-caps text-[10px] uppercase tracking-widest border-b cursor-pointer transition-colors py-1 ${
                        fVisible
                          ? "border-green-400 text-green-700"
                          : "border-slate-grey/30 text-slate-grey"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {fVisible ? "visibility" : "visibility_off"}
                      </span>
                      {fVisible ? "Visible on store" : "Hidden from store"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                      ) : isNew ? (
                        "Create Category"
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    {isNew && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setSelected(null);
                        }}
                        className="px-4 font-button text-[11px] uppercase border border-slate-grey/30 text-ink-black hover:border-ink-black transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Info note */}
                  <p className="text-[10px] text-slate-grey/70 font-label-caps uppercase tracking-widest text-center pt-1">
                    Changes reflect on{" "}
                    <a
                      href="/categories"
                      target="_blank"
                      className="underline hover:text-deep-navy"
                    >
                      /categories
                    </a>{" "}
                    and the homepage "Shop by Category" section.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Help note */}
        {!loading && (
          <div className="bg-pure-white border border-slate-grey/15 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] text-slate-grey shrink-0 mt-0.5">
              info
            </span>
            <div className="space-y-1">
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy font-bold">
                How Categories Work
              </p>
              <p className="font-body-md text-xs text-slate-grey leading-relaxed">
                Categories appear on the{" "}
                <a href="/categories" target="_blank" className="underline hover:text-deep-navy">
                  /categories
                </a>{" "}
                storefront page and in the <strong>"Shop by Category"</strong> carousel on the
                homepage. Hidden categories are invisible to customers but remain editable here.
                Use reorder arrows to control display order.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
