"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCollections } from "@/utils/api";

const DEFAULT_COLLECTIONS = [
  {
    id: "silent-center",
    title: "Silent Center",
    tagline: "For your balance",
    description: "A meditation on form and negative space. Pieces designed to ground you in the present moment, crafted with uncompromising architectural precision and conscious materials.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ1SV0eXJGZrnjfsm6WOrr3dKft0IVZvS2oM6Wf_4vqwndBPocrNSLKtPsbIWUU4g7YWrwgFZmE16ipICZ0QKg6NulSK0D4DTI4FLnuehTPqcKDF-MPdTTbMRnYiwYRh3zsWojYE3R1iHTC60ZfQ8QWGmDD8mnP3JETge_mPnGQPnFepdY66OuKQsUgWIiwNWQZhfsJ00eO2IOXl7WoHUmQypxFUQFslrgHABiUUv1WrU2ZYbRgDbO_H6gk84g6nofQG2mXVqa538",
    link: "/collections/silent-center",
  },
  {
    id: "solitude",
    title: "Solitude",
    tagline: "For your inner world",
    description: "Meticulous, ultra-minimalist designs that focus on purity and quiet comfort. Linear bands and empty spaces crafted for peaceful daily wear.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvjqmByDlRaJiifUTxVoINswXXm-PAkkbVJ9hcfeaPCrqjzkhDhne1pVofS21ApvXAeGd-OJFnGRzVL8xM1zqRCFmpkvOkIowL3V5vx4O5w-jEkPUpaAjd3iMY1jo-f1BXRbiYG4udPbS3MQHLhriu6sBx3BzN7lMwreEZ1yb4ZK1AR6DhvzuF6SFzUjcqZWiXVPPkEHA2TrBgX495Y9x6krS50C7hS02F_3H0td5UhiUYM92VuwUaofA_QbD6kd14XQ5N6xQdRN8",
    link: "/collections/silent-center?collection=solitude",
  },
  {
    id: "presence",
    title: "Presence",
    tagline: "For your everyday",
    description: "Bold geometric shapes and architectural volume that make a quiet statement of confidence, stability, and character.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDphu-s5pByRrI5yOYV0iUrAQhJYlFn9pL56eus7YnulYdC3nxZphQV-dBchzOg9F9C9LvMP1pu7Z-pLdoAmvfuYBpwUk4oJ5auvdPVe_jU2tO6Ldyghkc_ftk25VpTLHGq_4DKkpFIC_w_TgCVCFNwT7xlIzlR6i-4QQwgJHFq41jST-K1fySNIMaWHIa6EMO_OoRUmmcTTgSqML2SGB8jMU92aBukkLElsZJVzQ6iVNHyjlgVNaAN0M56RCO3uUNhT8hu1AAtAqw",
    link: "/collections/silent-center?collection=presence",
  },
  {
    id: "light",
    title: "Light",
    tagline: "For your becoming",
    description: "Highly polished, reflecting surfaces designed to catch and project light. A celebration of transformation, hope, and inner growth.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2QH2OVjZuf5WcRIEP7F8npj47F7LSlY4eXFlP_4urMQx5FXf9gd87o02ZumQ7pm2WKo25BGUt1bsNce0d7I-HD7QC5boW3dnerz7a62sWZjsKrvbRlbS01UwRXiArH8ZtnywdNRZ25CDJfp2abQpz-434ejKZ6OU9sBKPqqq3g10R3Dft5zyZcRp64hHVhotbtoe1SR8QHkWs_cLCp2FAQd7pl75u-fLJSWWvSsfYYBJ2TJ0V4keUY4FKlbyDFJSKzK5hMm4-Huc",
    link: "/collections/silent-center?collection=light",
  },
];

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
