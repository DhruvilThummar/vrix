"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDb } from "@/utils/api";

interface MetalType {
  id: string;
  name: string;
  swatch: string;
  description: string;
}

interface MetalSwatchesProps {
  selectedMetal: string;
  onSelectMetal: (metal: MetalType) => void;
}

export default function MetalSwatches({ selectedMetal, onSelectMetal }: MetalSwatchesProps) {
  const [metals, setMetals] = useState<MetalType[]>([
    {
      id: "18k-gold-vermeil",
      name: "18k Gold Vermeil",
      swatch: "https://images.unsplash.com/photo-1611591475140-be3a7c5b61f8?q=80&w=100&auto=format&fit=crop",
      description: "18k Solid Gold layered over Recycled Sterling Silver"
    },
    {
      id: "recycled-sterling-silver",
      name: "Recycled Sterling Silver",
      swatch: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=100&auto=format&fit=crop",
      description: "100% Recycled 925 Sterling Silver"
    },
    {
      id: "14k-rose-gold",
      name: "14k Rose Gold Vermeil",
      swatch: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=100&auto=format&fit=crop",
      description: "Warm 14k Rose Gold over Sterling Silver"
    }
  ]);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (Array.isArray(res.metal_types) && res.metal_types.length > 0) {
          setMetals(res.metal_types);
        }
      })
      .catch((err) => console.error("Failed to load metal_types from db:", err));
  }, []);

  const activeItem = metals.find((m) => m.name.toLowerCase() === selectedMetal.toLowerCase() || m.id === selectedMetal) || metals[0];

  return (
    <div className="space-y-2 py-3 border-y border-soft-linen">
      <div className="flex justify-between items-center text-[10px] font-label-caps uppercase tracking-widest">
        <span className="text-slate-grey">Finish & Material</span>
        <span className="text-deep-navy font-semibold">{activeItem?.name}</span>
      </div>

      <div className="flex items-center gap-3 pt-1">
        {metals.map((metal) => {
          const isSelected = activeItem?.id === metal.id;
          return (
            <button
              key={metal.id}
              onClick={() => onSelectMetal(metal)}
              title={metal.name}
              className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 cursor-pointer ${
                isSelected ? "border-black scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative bg-soft-linen">
                <Image
                  src={metal.swatch}
                  alt={metal.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            </button>
          );
        })}
      </div>

      {activeItem?.description && (
        <p className="text-[11px] text-slate-grey font-body-md leading-relaxed pt-1">
          {activeItem.description}
        </p>
      )}
    </div>
  );
}
