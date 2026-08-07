"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ComparisonData } from "./vrix-chat-types";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductComparisonViewProps {
  data: ComparisonData;
}

export default function ProductComparisonView({ data }: ProductComparisonViewProps) {
  const { formatPrice } = useCurrency();
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);

  const products = data.products.slice(0, 3);
  if (products.length === 0) return null;

  return (
    <div className="w-full my-2 space-y-3">
      {/* Desktop / Tablet Grid View (>=640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-sm border border-outline-variant bg-surface">
        <table className="w-full text-left text-xs font-jost border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="p-2.5 font-label-caps text-[10px] uppercase text-on-surface-variant w-1/4">Spec</th>
              {products.map((p) => (
                <th key={p.id} className="p-2.5 font-inter font-semibold text-on-surface text-center">
                  <div className="relative w-12 h-12 mx-auto mb-1 rounded overflow-hidden">
                    <Image src={p.image} alt={p.title} fill className="object-cover" />
                  </div>
                  <span className="line-clamp-1">{p.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-on-surface">
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Price</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center font-semibold text-primary">
                  {formatPrice(p.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Metal</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center">
                  {p.material}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Stone / Gem</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center">
                  {p.stone || "N/A"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Category</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center">
                  {p.category}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Warranty</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center text-[11px] text-on-surface-variant">
                  {p.warranty || "Standard VRIX Guarantee"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-on-surface-variant">Action</td>
              {products.map((p) => (
                <td key={p.id} className="p-2.5 text-center">
                  <Link
                    href={`/product/${p.slug || p.id}`}
                    className="font-button text-[10px] text-primary underline font-semibold"
                  >
                    View
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Swipeable / Tabbed Stacked Cards View (<640px) */}
      <div className="block sm:hidden border border-outline-variant bg-surface rounded-sm p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
            Comparing ({activeMobileIdx + 1}/{products.length})
          </span>
          <div className="flex gap-1">
            {products.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveMobileIdx(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeMobileIdx === idx ? "bg-primary" : "bg-outline-variant"
                }`}
              />
            ))}
          </div>
        </div>

        {(() => {
          const activeItem = products[activeMobileIdx];
          return (
            <div className="space-y-2 text-xs font-jost">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded overflow-hidden shrink-0">
                  <Image src={activeItem.image} alt={activeItem.title} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-inter font-semibold text-on-surface text-sm leading-snug">{activeItem.title}</h4>
                  <p className="font-semibold text-primary text-xs">{formatPrice(activeItem.price)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/40">
                <div className="bg-surface-container-low p-2 rounded-xs">
                  <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Metal</span>
                  <span className="font-medium text-on-surface">{activeItem.material}</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-xs">
                  <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Stone</span>
                  <span className="font-medium text-on-surface">{activeItem.stone || "None"}</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-xs">
                  <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Category</span>
                  <span className="font-medium text-on-surface">{activeItem.category}</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-xs">
                  <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Warranty</span>
                  <span className="font-medium text-on-surface">{activeItem.warranty || "Standard"}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveMobileIdx((prev) => (prev + 1) % products.length)}
                  className="font-button text-[11px] text-on-surface-variant flex items-center gap-1"
                >
                  <span>Next product</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
                <Link
                  href={`/product/${activeItem.slug || activeItem.id}`}
                  className="header-nav-link font-button text-button text-xs text-primary font-semibold"
                >
                  View details
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
