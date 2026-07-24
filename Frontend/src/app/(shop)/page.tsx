"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDbPublic as fetchDb } from "@/utils/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonImage from "@/components/shop/SkeletonImage";

const DEFAULT_DATA = {
  homepage: {
    heroTitle: "the moments that belong only to you.",
    heroSubtitle: "Luxury for",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKm3tn95_-TIhyvUMx8vgFS38HrCWsOHrBrnyyeFJBjd_z2sFkgf5ElPRFPGEnwOnMlGRiBDK_yZli7qo7IWe6wwJ1VqDr340H5hr9tu8L6hDEscfaEIE7CKE6wyny9Ao-FKjI5oEmmy28ll5qNZ3iJT-IvgjyY1T2K-tX9l-V1BKl1fvhmcgjLXq_FDQh_OhA0YEk29NB0ijya6TEA6ezmJwuFFzj7vo4A-AooABaJafBIBd-hoJo6vtg5MoS_rDu9I325sFCuVY",
    tagline: "Pieces that speak in silence.",
    philosophyTitle: "More than jewelry.\nIt's a way of being.",
    philosophy: [
      {
        icon: "flare",
        title: "Intentional Design",
        description: "Every piece has\na deeper meaning."
      },
      {
        icon: "hourglass_empty",
        title: "Timeless Quality",
        description: "Crafted to last.\nMade to be lived in."
      },
      {
        icon: "eco",
        title: "Conscious Luxury",
        description: "Ethical materials.\nThoughtful process."
      },
      {
        icon: "favorite_border",
        title: "Personal Connection",
        description: "A piece for every\nchapter of you."
      }
    ]
  },
  collections: [] as any[],
};

export default function Home() {
  const [store, setStore] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.homepage && Array.isArray(res.collections)) {
          setStore({
            homepage: {
              ...DEFAULT_DATA.homepage,
              ...res.homepage,
            },
            collections: res.collections.filter((collection: any) => collection.isVisible !== false),
          });
        }
      })
      .catch((err) => console.error("Error loading home page content:", err))
      .finally(() => {
        // Add a slight simulation delay for a smoother premium skeleton transition
        setTimeout(() => setLoading(false), 600);
      });
  }, []);

  return (
    <div className="w-full">
      {/* ─── Hero Section ─── */}
      <section className="relative h-[819px] md:h-[calc(100vh-65px)] w-full flex items-center bg-[#EBEAE4] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 z-0">
            <Skeleton height="100%" borderRadius="0px" containerClassName="w-full h-full block" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0">
            <SkeletonImage
              alt="Hero Background"
              fill
              className="object-cover object-center opacity-65 mix-blend-overlay"
              src={store.homepage.heroImage}
              priority
              sizes="100vw"
            />
          </div>
        )}
        
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-xl text-ink-black md:text-pure-white">
            <p className="font-label-caps text-label-caps mb-stack-md tracking-widest uppercase opacity-80">
              {loading ? <Skeleton width={120} /> : store.homepage.heroSubtitle}
            </p>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-lg leading-tight uppercase font-light">
              {loading ? (
                <>
                  <Skeleton width="90%" />
                  <Skeleton width="60%" />
                </>
              ) : (
                store.homepage.heroTitle
              )}
            </h1>
            {loading ? (
              <Skeleton width={160} height={40} />
            ) : (
              <Link
                href="/collections/silent-center"
                className="inline-block font-button text-button uppercase px-8 py-3 border border-ink-black md:border-pure-white text-ink-black md:text-pure-white hover:bg-ink-black hover:text-white md:hover:bg-pure-white md:hover:text-deep-navy transition-colors duration-300 cursor-pointer tracking-wider"
              >
                Discover Collections
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Collections Grid ─── */}
      <section className="py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-section-gap">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
            Our Collections
          </p>
          <h2 className="font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
            {loading ? <Skeleton width={280} /> : store.homepage.tagline}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-[4/5] mb-stack-md w-full">
                  <Skeleton height="100%" borderRadius="0px" containerClassName="w-full h-full block" />
                </div>
                <div className="text-center space-y-1">
                  <Skeleton width="60%" height={14} className="mx-auto" />
                  <Skeleton width="40%" height={10} className="mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {store.collections.map((col) => (
              <Link
                key={col.id}
                href={col.link || `/collections/silent-center?collection=${col.id}`}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] bg-soft-linen mb-stack-md overflow-hidden relative border border-slate-grey/10">
                  <SkeletonImage
                    alt={`${col.title} Collection`}
                    fill
                    className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                    src={col.image}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-label-caps text-label-caps text-deep-navy uppercase mb-1 font-semibold">
                    {col.title}
                  </h3>
                  <p className="font-body-md text-slate-grey text-sm">
                    {col.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-stack-lg text-center">
          {loading ? (
            <Skeleton width={180} height={20} className="mx-auto" />
          ) : (
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 font-button text-button text-deep-navy hover:text-slate-grey transition-colors uppercase tracking-widest border-b border-deep-navy pb-1 cursor-pointer"
            >
              Explore All Collections <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          )}
        </div>
      </section>

      {/* ─── Brand Philosophy / Features ─── */}
      <section className="bg-[#F5F4F0] py-section-gap border-t border-b border-slate-grey/25">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
            The World of VRIX
          </p>
          <h2 className="font-headline-md text-headline-md text-deep-navy mb-section-gap leading-tight uppercase whitespace-pre-line font-light tracking-wide">
            {loading ? <Skeleton width="50%" height={32} className="mx-auto" /> : store.homepage.philosophyTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-lg">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-3">
                    <Skeleton circle width={50} height={50} />
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="80%" height={10} count={2} />
                  </div>
                ))
              : store.homepage.philosophy.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-deep-navy mb-stack-md text-3xl font-light">
                      {item.icon}
                    </span>
                    <h4 className="font-label-caps text-label-caps text-deep-navy uppercase mb-2 font-semibold">
                      {item.title}
                    </h4>
                    <p className="font-body-md text-sm text-slate-grey whitespace-pre-line leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}
