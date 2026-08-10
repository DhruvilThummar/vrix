"use client";
import React, { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = "chains" | "pendants" | "charms";
type Material = "all" | "18k-gold" | "white-gold" | "rose-gold";

interface JewelryItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  material: Material;
  src: string;
}

// ── Static Catalog ─────────────────────────────────────────────────────────────
const CATALOG: JewelryItem[] = [
  // Chains
  {
    id: "chain-cable",
    name: "Essential Cable",
    price: 450,
    category: "chains",
    material: "18k-gold",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuha5zmxZjmeurSbFmLeS0A4scbLmS0sXOUGX3HGeCZW-0LBjj_EZi9uZGQzuA3WuliNq11lLrQ8z_cOgy-vDru_iw6qLTcqRRk0xu8ZOv1Gcn-Jm-etxAtw4fiG214lr7L__QlZPOqorts7ragMx_r2xOtdfHZF9TlnUVAXDEzmLDfU4G0zh3UwPwxrIWjAmw42H2ezmLCfKl7suIAU6aVZFV3Go_TmNkgzETOHGCM5zV_KhqOUYvZ5w2-28IMR_58hzXZQuKZbk",
  },
  {
    id: "chain-bold",
    name: "Bold Link",
    price: 890,
    category: "chains",
    material: "18k-gold",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOoZW-WndYhfg6dhj4b4btq4TkiQJYFg0nxYOY2Q8hDGr2950GVLdZcD26JHKlwrI9u2I0uADIwyVR1Hq2j3SgxFBPtHyUpJr4VEbQyI4kO1uzzTUA0PGkc4i52QwOREMajoEOlJJtQbkOiZ5FKWE5Dw4VH45QEG0WW1N3Iy5_G9fFbys1qAdkFkTEP1seaODbQijANmq1TVzyaS2Kx_wAti1BrQlVVz6oAGPdZcpAS--9LIdzeX4YpqmPEtNqNl7U8nelFhdP-Mw",
  },
  {
    id: "chain-snake",
    name: "Fluid Snake",
    price: 620,
    category: "chains",
    material: "white-gold",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqBMHZjO-U7MNrbFA31FOs0LWh9uPmO6HYWl0id2ZD0_0eoY-7bPY51TJfZYZTcCgcJnSbNSmZZZlRCvq1cavyTVinKlVy_KU3fv_hHOk5G89-TjUXpoRGJuQBMqSZIrZXnaYKB0bIiCvceW3_fS5jJQinZyjPVDvJ8s9DollB_1XDLKRp29h_vVv1o21BQtHzuB7WWCpBitO4hsraAA9z-J1h1_gs206flmjV9tHXHcrU1GeSJeBT7OXLRHIj3zoUPwflxwCFtk8",
  },
  {
    id: "chain-box",
    name: "Structured Box",
    price: 550,
    category: "chains",
    material: "rose-gold",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBn0ya7aWZiUzvRR0W8voBIkrT_kQpJmTlRNfn0awIYeHtJTY6oTOWvp7p5iK1TK1EBGU0KrPmi5E0etMNY83VQ6-oi_rDAgsfKckAAzYj4kwGKqqVkyGjxFsYQKr72UKyAWazral0V4Rb9IRKeHLKHb83Aj2Q4qkIDu8eBknM_NN_F-2TtJkRZF_9fIPum9oINKOJMmYd9fIdtG0DANAOpyr8feOTRmwzfSDFvEpmxq_ocFnWCsWT7eWD18ziy6_rC00tS78WC26U",
  },
  // Pendants
  {
    id: "pendant-solitaire",
    name: "Solitaire Drop",
    price: 320,
    category: "pendants",
    material: "18k-gold",
    src: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&auto=format&fit=crop",
  },
  {
    id: "pendant-pearl",
    name: "Baroque Pearl",
    price: 480,
    category: "pendants",
    material: "white-gold",
    src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop",
  },
  {
    id: "pendant-star",
    name: "Constellation Star",
    price: 280,
    category: "pendants",
    material: "18k-gold",
    src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop",
  },
  {
    id: "pendant-crescent",
    name: "Crescent Moon",
    price: 360,
    category: "pendants",
    material: "rose-gold",
    src: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&auto=format&fit=crop",
  },
  // Charms
  {
    id: "charm-initial",
    name: "Initial Letter",
    price: 150,
    category: "charms",
    material: "18k-gold",
    src: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&auto=format&fit=crop",
  },
  {
    id: "charm-infinity",
    name: "Infinity Loop",
    price: 190,
    category: "charms",
    material: "white-gold",
    src: "https://images.unsplash.com/photo-1589643385060-2d4dba2ff1f3?w=400&auto=format&fit=crop",
  },
  {
    id: "charm-clover",
    name: "Lucky Clover",
    price: 210,
    category: "charms",
    material: "18k-gold",
    src: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&auto=format&fit=crop",
  },
  {
    id: "charm-zodiac",
    name: "Zodiac Sign",
    price: 175,
    category: "charms",
    material: "rose-gold",
    src: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&auto=format&fit=crop",
  },
];

const MATERIAL_LABELS: Record<Material, string> = {
  "all": "All Metals",
  "18k-gold": "18K Gold",
  "white-gold": "White Gold",
  "rose-gold": "Rose Gold",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ModularBuilderPage() {
  const [activeTab, setActiveTab] = useState<Category>("chains");
  const [activeMaterial, setActiveMaterial] = useState<Material>("all");
  const [canvasItems, setCanvasItems] = useState<JewelryItem[]>([]);
  const [history, setHistory] = useState<JewelryItem[][]>([[]]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [justDropped, setJustDropped] = useState<string | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const totalPrice = canvasItems.reduce((sum, item) => sum + item.price, 0);
  const hasChain = canvasItems.some((i) => i.category === "chains");

  const visibleItems = CATALOG.filter(
    (item) =>
      item.category === activeTab &&
      (activeMaterial === "all" || item.material === activeMaterial)
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const pushHistory = useCallback((items: JewelryItem[]) => {
    setHistory((prev) => [...prev, items]);
  }, []);

  const addToCanvas = (item: JewelryItem) => {
    setCanvasItems((prev) => {
      // Only one chain allowed
      if (item.category === "chains") {
        const without = prev.filter((i) => i.category !== "chains");
        const next = [item, ...without];
        pushHistory(next);
        return next;
      }
      // Avoid duplicate pendants/charms
      if (prev.find((i) => i.id === item.id)) return prev;
      const next = [...prev, item];
      pushHistory(next);
      return next;
    });
    setJustDropped(item.id);
    setTimeout(() => setJustDropped(null), 700);
  };

  const removeFromCanvas = (id: string) => {
    setCanvasItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      pushHistory(next);
      return next;
    });
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory((h) => h.slice(0, -1));
    setCanvasItems(prev);
  };

  const handleReset = () => {
    pushHistory([]);
    setCanvasItems([]);
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, item: JewelryItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingId(item.id);
  };

  const handleDragEnd = () => setDraggingId(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData("itemId");
    const item = CATALOG.find((i) => i.id === itemId);
    if (item) addToCanvas(item);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full">
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* ── CANVAS SECTION ─────────────────────────────────────────────────── */}
        <section className="flex-grow bg-soft-linen relative flex flex-col">

          {/* Top bar */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
            <div>
              <h1 className="font-headline-md text-headline-md text-ink-black mb-1 pointer-events-auto">
                Modular Builder
              </h1>
              <p className="font-body-md text-body-md text-slate-grey pointer-events-auto">
                Drag components to construct your piece.
              </p>
            </div>
            <div className="flex gap-3 pointer-events-auto">
              <button
                aria-label="Undo"
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-2 rounded-full border border-slate-grey/30 text-slate-grey hover:text-ink-black hover:border-ink-black/50 transition-colors bg-pure-white/60 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined icon-weight-regular">undo</span>
              </button>
              <button
                aria-label="Reset Canvas"
                onClick={handleReset}
                disabled={canvasItems.length === 0}
                className="p-2 rounded-full border border-slate-grey/30 text-slate-grey hover:text-ink-black hover:border-ink-black/50 transition-colors bg-pure-white/60 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined icon-weight-regular">restart_alt</span>
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className="flex-grow flex flex-col items-center justify-center relative overflow-hidden pt-24 pb-4 px-6"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drop target ring */}
            <div
              className={`w-72 h-72 md:w-96 md:h-96 rounded-full border-2 flex items-center justify-center relative transition-all duration-300 ${
                isDragOver
                  ? "border-deep-navy border-solid shadow-[0_0_40px_rgba(10,20,60,0.15)] scale-105"
                  : canvasItems.length === 0
                  ? "border-dashed border-slate-grey/30 opacity-60"
                  : "border-dashed border-deep-navy/20"
              }`}
            >
              {canvasItems.length === 0 && !isDragOver && (
                <span className="font-label-caps text-label-caps text-slate-grey tracking-widest text-center uppercase text-xs px-8">
                  Drop Chain Base Here
                </span>
              )}
              {isDragOver && (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-deep-navy text-4xl animate-bounce">add_circle</span>
                  <span className="font-label-caps text-xs text-deep-navy tracking-widest uppercase">Release to Add</span>
                </div>
              )}
            </div>

            {/* Canvas items display */}
            {canvasItems.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 pointer-events-none">
                {canvasItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-3 bg-pure-white/80 backdrop-blur-sm border border-slate-grey/20 px-4 py-2.5 shadow-sm pointer-events-auto transition-all duration-500 ${
                      justDropped === item.id ? "scale-110 shadow-lg" : "scale-100"
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="w-10 h-10 bg-soft-linen rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.src}
                        alt={item.name}
                        className="w-full h-full object-cover mix-blend-multiply"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80"; }}
                      />
                    </div>
                    <div>
                      <p className="font-label-caps text-[11px] text-ink-black uppercase tracking-wider">{item.name}</p>
                      <p className="text-[10px] text-slate-grey font-body-md">${item.price} · {MATERIAL_LABELS[item.material]}</p>
                    </div>
                    <span className="mx-2 text-[9px] uppercase tracking-widest font-label-caps text-slate-grey/50 border border-slate-grey/20 px-1.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <button
                      onClick={() => removeFromCanvas(item.id)}
                      className="ml-auto p-1 text-slate-grey hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drag hint */}
            {canvasItems.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <p className="text-[9px] text-slate-grey/60 uppercase tracking-widest font-label-caps text-center">
                  Drag more to layer · Click × to remove
                </p>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-pure-white border-t border-slate-grey/20 px-6 py-4 flex justify-between items-center z-20">
            <div className="hidden md:block">
              <p className="font-label-caps text-[10px] text-slate-grey mb-0.5 uppercase tracking-widest">Estimated Total</p>
              <p className="font-headline-md text-headline-md text-ink-black transition-all duration-300">
                ${totalPrice.toLocaleString()}
              </p>
              {canvasItems.length > 0 && (
                <p className="text-[10px] text-slate-grey">{canvasItems.length} piece{canvasItems.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
            <button
              disabled={canvasItems.length === 0}
              className="w-full md:w-auto bg-deep-navy text-pure-white font-button text-button uppercase tracking-widest py-4 px-8 hover:bg-deep-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Final Piece
              <span className="material-symbols-outlined icon-weight-medium">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* ── COMPONENT PANEL ────────────────────────────────────────────────── */}
        <aside className="w-full md:w-96 bg-pure-white border-l border-slate-grey/20 flex flex-col flex-none h-[480px] md:h-auto overflow-hidden">

          {/* Category Tabs */}
          <div className="flex border-b border-slate-grey/20 w-full">
            {(["chains", "pendants", "charms"] as Category[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-3 font-label-caps text-label-caps whitespace-nowrap text-center capitalize transition-colors text-xs tracking-widest uppercase ${
                  activeTab === tab
                    ? "text-deep-navy border-b-2 border-deep-navy"
                    : "text-slate-grey hover:text-ink-black"
                }`}
              >
                {tab}
                {tab === "chains" && !hasChain && (
                  <span className="ml-1 text-[8px] bg-deep-navy/10 text-deep-navy px-1 rounded uppercase">
                    Start here
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Material Filters */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar border-b border-slate-grey/10">
            {(["all", "18k-gold", "white-gold", "rose-gold"] as Material[]).map((mat) => (
              <button
                key={mat}
                onClick={() => setActiveMaterial(mat)}
                className={`px-3 py-1 rounded-full font-label-caps text-[10px] whitespace-nowrap cursor-pointer transition-all ${
                  activeMaterial === mat
                    ? "bg-ink-black text-pure-white border border-ink-black"
                    : "border border-slate-grey/30 text-slate-grey hover:border-ink-black hover:text-ink-black"
                }`}
              >
                {MATERIAL_LABELS[mat]}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
            {visibleItems.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-grey/30">search_off</span>
                <p className="text-slate-grey text-xs font-body-md">No items in this filter</p>
              </div>
            ) : (
              visibleItems.map((item) => {
                const isOnCanvas = canvasItems.some((c) => c.id === item.id);
                const isBeingDragged = draggingId === item.id;
                return (
                  <div
                    key={item.id}
                    id={`item-${item.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className={`group cursor-grab active:cursor-grabbing flex flex-col border p-2 transition-all relative select-none ${
                      isOnCanvas
                        ? "border-deep-navy/40 bg-deep-navy/3"
                        : "border-transparent hover:border-slate-grey/20"
                    } ${isBeingDragged ? "opacity-40 scale-95" : "opacity-100"}`}
                  >
                    {/* Added badge */}
                    {isOnCanvas && (
                      <div className="absolute top-3 left-3 z-10 bg-deep-navy text-pure-white text-[8px] font-label-caps px-1.5 py-0.5 uppercase tracking-wider rounded">
                        Added
                      </div>
                    )}

                    <div className="aspect-square bg-soft-linen mb-2 flex items-center justify-center overflow-hidden relative">
                      <img
                        alt={item.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        src={item.src}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200"; }}
                        draggable={false}
                      />
                      {/* Quick-add on hover */}
                      <button
                        onClick={() => addToCanvas(item)}
                        className="absolute inset-0 bg-ink-black/0 hover:bg-ink-black/10 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label={`Add ${item.name}`}
                      >
                        <span className="bg-pure-white text-ink-black text-[9px] font-label-caps uppercase tracking-widest px-3 py-1 shadow-sm">
                          + Add
                        </span>
                      </button>
                    </div>

                    <h3 className="font-label-caps text-[11px] text-ink-black mb-0.5 uppercase tracking-wider">{item.name}</h3>
                    <p className="font-body-md text-slate-grey text-[11px]">${item.price}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile price footer */}
          <div className="md:hidden border-t border-slate-grey/15 px-4 py-3 bg-soft-linen/30 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-grey uppercase tracking-widest font-label-caps">Total</p>
              <p className="font-headline-md text-ink-black">${totalPrice.toLocaleString()}</p>
            </div>
            <button
              disabled={canvasItems.length === 0}
              className="bg-deep-navy text-pure-white font-button text-[11px] uppercase tracking-widest py-3 px-6 hover:bg-deep-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review →
            </button>
          </div>
        </aside>

      </main>
    </div>
  );
}
