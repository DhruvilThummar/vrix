"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCollections } from "@/utils/api";

const DEFAULT_COLLECTIONS: any[] = [];

export default function CollectionsPage() {
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);

  useEffect(() => {
    fetchCollections()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCollections(res);
        }
      })
      .catch((err) => console.error("Error fetching collections:", err));
  }, []);

  return (
    <div className="w-full bg-surface min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        {/* Editorial Title */}
        <header className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest">
            VRIX Collections
          </p>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-deep-navy uppercase">
            Architectures of quiet luxury
          </h1>
          <p className="font-body-lg text-body-lg text-slate-grey leading-relaxed">
            Conscious luxury and architectural precision. Explore our curated collections, each a meditation on form, space, and quiet confidence.
          </p>
        </header>

        {/* Collections Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group flex flex-col bg-pure-white border border-slate-grey/10 hover:border-slate-grey/25 transition-all duration-500 shadow-sm"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-soft-linen">
                <Image
                  alt={col.title}
                  fill
                  className="object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
                  src={col.image}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Text Container */}
              <div className="p-8 flex flex-col flex-grow justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h2 className="font-headline-md text-headline-md text-deep-navy uppercase">
                      {col.title}
                    </h2>
                    <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                      {col.tagline}
                    </span>
                  </div>
                  <p className="font-body-md text-slate-grey text-sm leading-relaxed">
                    {col.description}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-grey/10">
                  <Link
                    href={col.link || `/collections/silent-center?collection=${col.id}`}
                    className="inline-flex items-center gap-2 font-button text-button text-deep-navy hover:text-slate-grey transition-colors uppercase tracking-widest"
                  >
                    View Collection
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
