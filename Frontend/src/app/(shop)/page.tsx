"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { fetchDbPublic as fetchDb, fetchProducts } from "@/utils/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonImage from "@/components/shop/SkeletonImage";

const DEFAULT_CATEGORIES = [
  { title: "Necklace", image: "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/z7ekw55bkfo527ivhzme.png", link: "/collections/silent-center?type=necklace" },
  { title: "Earrings", image: "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/apetikskyjypxmrcvdwe.png", link: "/collections/silent-center?type=earrings" },
  { title: "Bracelets", image: "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/cksu4mgtvw5iowjpe2h8.png", link: "/collections/silent-center?type=bracelet" },
  { title: "Rings", image: "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i3fkvzr4zlvqbnhzjixd.png", link: "/collections/silent-center?type=rings" },
  { title: "Charms", image: "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i0mfwsxjrxpdkdti4sp7.png", link: "/collections/silent-center?type=charms" },
];

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
    ],
    categories: [] as any[],
    featuredCollections: [] as string[],
    newArrivals: [] as string[],
    featuredProducts: [] as string[]
  },
  collections: [] as any[],
};

export default function Home() {
  const [store, setStore] = useState(DEFAULT_DATA);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = categoryScrollRef.current.clientWidth;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const slides = useMemo(() => {
    const customSlides = (store.homepage as any).heroSlides || [];
    if (customSlides.length > 0) return customSlides;
    return [
      {
        title: store.homepage.heroTitle || "the moments that belong only to you.",
        subtitle: store.homepage.heroSubtitle || "Luxury for",
        image: store.homepage.heroImage || DEFAULT_DATA.homepage.heroImage,
        link: "/collections/silent-center",
        linkText: "Discover Collections"
      }
    ];
  }, [store.homepage]);

  // Always-on Hero Auto Slider (every 4 seconds)
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides]);

  // Always-on Category Carousel Auto Scroll (every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (categoryScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          categoryScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          categoryScrollRef.current.scrollBy({ left: clientWidth / 2, behavior: "smooth" });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([fetchDb(), fetchProducts()])
      .then(([res, prodRes]) => {
        setAllProducts(prodRes || []);
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

  // Filter collections and products based on admin layout options
  const featuredCollectionsList = useMemo(() => {
    const ids = store.homepage.featuredCollections || [];
    if (ids.length === 0) return store.collections.slice(0, 4);
    return ids
      .map((id) => store.collections.find((c) => c.id === id))
      .filter(Boolean);
  }, [store.homepage.featuredCollections, store.collections]);

  const newArrivalsList = useMemo(() => {
    const ids = store.homepage.newArrivals || [];
    if (ids.length === 0) return allProducts.slice(0, 4);
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }, [store.homepage.newArrivals, allProducts]);

  const featuredProductsList = useMemo(() => {
    const ids = store.homepage.featuredProducts || [];
    if (ids.length === 0) return allProducts.slice(4, 8);
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }, [store.homepage.featuredProducts, allProducts]);

  return (
    <div className="w-full">
      {/* ─── Hero Section ─── */}
      <section className="relative h-[819px] md:h-screen w-full flex items-center bg-[#EBEAE4] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 z-0">
            <Skeleton height="100%" borderRadius="0px" containerClassName="w-full h-full block" />
          </div>
        ) : slides.length > 0 ? (
          slides.map((slide: any, sIdx: number) => (
            <div
              key={sIdx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                sIdx === activeSlide ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="absolute inset-0">
                <SkeletonImage
                  alt={slide.title || "Hero Slide"}
                  fill
                  className="object-cover object-center"
                  src={slide.image}
                  priority={sIdx === 0}
                  sizes="100vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/10 md:bg-transparent" />
              
              <div className="relative z-10 h-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full flex items-center">
                <div className="max-w-xl text-ink-black md:text-pure-white">
                  <p className="font-label-caps text-label-caps mb-stack-md tracking-widest uppercase opacity-80">
                    {slide.subtitle}
                  </p>
                  <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-lg leading-tight uppercase font-light">
                    {slide.title}
                  </h1>
                  <Link
                    href={slide.link || "/collections/silent-center"}
                    className="inline-block font-button text-button uppercase px-8 py-3 border border-ink-black md:border-pure-white text-ink-black md:text-pure-white hover:bg-ink-black hover:text-white md:hover:bg-pure-white md:hover:text-deep-navy transition-colors duration-300 cursor-pointer tracking-wider"
                  >
                    {slide.linkText || "Discover Collections"}
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="absolute inset-0 z-0">
              <SkeletonImage
                alt="Hero Background"
                fill
                className="object-cover object-center"
                src={store.homepage.heroImage}
                priority
                sizes="100vw"
              />
            </div>
            <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
              <div className="max-w-xl text-ink-black md:text-pure-white">
                <p className="font-label-caps text-label-caps mb-stack-md tracking-widest uppercase opacity-80">
                  {store.homepage.heroSubtitle}
                </p>
                <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-lg leading-tight uppercase font-light">
                  {store.homepage.heroTitle}
                </h1>
                <Link
                  href="/collections/silent-center"
                  className="inline-block font-button text-button uppercase px-8 py-3 border border-ink-black md:border-pure-white text-ink-black md:text-pure-white hover:bg-ink-black hover:text-white md:hover:bg-pure-white md:hover:text-deep-navy transition-colors duration-300 cursor-pointer tracking-wider"
                >
                  Discover Collections
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Carousel indicator dots */}
        {!loading && slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2.5">
            {slides.map((_: any, sIdx: number) => (
              <button
                key={sIdx}
                onClick={() => setActiveSlide(sIdx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  sIdx === activeSlide ? "bg-ink-black md:bg-pure-white scale-125" : "bg-ink-black/40 md:bg-pure-white/40 hover:bg-ink-black/70 md:hover:bg-pure-white/70"
                }`}
                aria-label={`Go to slide ${sIdx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Collections Grid ─── */}
      {(loading || featuredCollectionsList.length > 0) && (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {featuredCollectionsList.map((col: any) => (
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
      )}

      {/* ─── Shop by Category Section (Single Line Carousel) ─── */}
      {(loading || (store.homepage.categories && store.homepage.categories.length > 0 ? store.homepage.categories : DEFAULT_CATEGORIES).length > 0) && (
        <section className="py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="flex items-end justify-between mb-section-gap">
            <div>
              <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
                Atelier Selections
              </p>
              <h2 className="font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
                Shop by Category
              </h2>
            </div>
            {/* Carousel Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCategories("left")}
                className="w-10 h-10 rounded-full border border-slate-grey/30 flex items-center justify-center text-deep-navy hover:bg-deep-navy hover:text-white transition-all cursor-pointer shadow-xs"
                aria-label="Previous categories"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={() => scrollCategories("right")}
                className="w-10 h-10 rounded-full border border-slate-grey/30 flex items-center justify-center text-deep-navy hover:bg-deep-navy hover:text-white transition-all cursor-pointer shadow-xs"
                aria-label="Next categories"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square w-full">
                  <Skeleton height="100%" borderRadius="0px" containerClassName="w-full h-full block" />
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={categoryScrollRef}
              className="flex overflow-x-auto scroll-smooth scrollbar-none gap-product-gap py-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(store.homepage.categories && store.homepage.categories.length > 0 ? store.homepage.categories : DEFAULT_CATEGORIES).map((cat: any, idx: number) => (
                <div key={idx} className="w-[calc(50%-8px)] md:w-[calc(25%-12px)] shrink-0 snap-start">
                  <Link href={cat.link} className="group relative aspect-square overflow-hidden border border-slate-grey/10 cursor-pointer block rounded shadow-xs">
                    <SkeletonImage
                      alt={cat.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      src={cat.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"}
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent flex items-end p-5 transition-opacity duration-300 group-hover:opacity-95">
                      <div className="w-full flex justify-between items-center text-pure-white">
                        <span className="font-label-caps text-sm tracking-widest uppercase font-semibold">{cat.title}</span>
                        <span className="material-symbols-outlined text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── New Arrivals Product Section ─── */}
      {(loading || newArrivalsList.length > 0) && (
        <section className="py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="text-center mb-section-gap">
            <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
              Atelier Releases
            </p>
            <h2 className="font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
              New Arrivals
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden mb-2">
                    <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <Skeleton height={14} width="70%" />
                    <Skeleton height={14} width="20%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {newArrivalsList.map((p: any) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col group cursor-pointer">
                  <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden border border-slate-grey/10">
                    <Image
                      alt={p.title}
                      fill
                      className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                      src={p.image}
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <div className="mt-3 flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-body-md text-sm text-ink-black font-medium truncate">{p.title}</h3>
                      <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">{p.material}</span>
                    </div>
                    <span className="font-body-md text-sm text-ink-black font-semibold">${p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Featured Products Section ─── */}
      {(loading || featuredProductsList.length > 0) && (
        <section className="py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="text-center mb-section-gap">
            <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
              Curated Atelier Picks
            </p>
            <h2 className="font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
              Featured Products
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden mb-2">
                    <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <Skeleton height={14} width="70%" />
                    <Skeleton height={14} width="20%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-product-gap">
              {featuredProductsList.map((p: any) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col group cursor-pointer">
                  <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden border border-slate-grey/10">
                    <Image
                      alt={p.title}
                      fill
                      className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                      src={p.image}
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <div className="mt-3 flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-body-md text-sm text-ink-black font-medium truncate">{p.title}</h3>
                      <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">{p.material}</span>
                    </div>
                    <span className="font-body-md text-sm text-ink-black font-semibold">${p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Brand Philosophy / Features ─── */}
      <section className="bg-[#F5F4F0] py-section-gap border-t border-slate-grey/25">
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
