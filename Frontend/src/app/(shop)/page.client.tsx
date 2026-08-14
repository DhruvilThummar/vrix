"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonImage from "@/components/shop/SkeletonImage";
import { useCurrency } from "@/context/CurrencyContext";
import ProductCard from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";

// Embla carousel
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

// GSAP
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

import FormattedText from "@/components/FormattedText";

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
    heroImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb5y5IditA2tBdbqWqO8dXhIg6_t5tPnRSL4gXbBKZK5JAwiJxX6mLIYLP&s=10",
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
    featuredProducts: [] as string[],
    carouselSettings: {
      collectionsAutoScroll: true,
      collectionsInterval: 3500,
      newArrivalsAutoScroll: true,
      newArrivalsInterval: 4000,
      featuredAutoScroll: true,
      featuredInterval: 4500,
    }
  },
  collections: [] as any[],
  wishlist: [] as string[],
};

interface HomepageClientProps {
  initialData?: any;
  initialProducts?: any[];
}

export default function HomepageClient({ initialData, initialProducts }: HomepageClientProps) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [store, setStore] = useState(() => {
    if (initialData?.homepage) {
      return {
        homepage: { ...DEFAULT_DATA.homepage, ...initialData.homepage },
        collections: (initialData.collections || []).filter((collection: any) => collection.isVisible !== false),
      };
    }
    return DEFAULT_DATA;
  });
  const [allProducts, setAllProducts] = useState<any[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialData);
  const [activeSlide, setActiveSlide] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync wishlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Progressive background lazy loading of products only if server didn't provide initialProducts
  useEffect(() => {
    if (typeof window === "undefined" || (initialProducts && initialProducts.length > 0)) return;
    const timer = setTimeout(async () => {
      try {
        const { fetchProducts } = await import("@/utils/api");
        const freshProducts = await fetchProducts();
        if (Array.isArray(freshProducts) && freshProducts.length > 0) {
          setAllProducts(freshProducts);
        }
      } catch (err) {
        // Silent catch for background lazy loader
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [initialProducts]);

  const toggleWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let list = [...wishlist];
      if (list.includes(id)) {
        list = list.filter((item) => item !== id);
        showToast(`Removed "${title}" from Wishlist.`);
      } else {
        list.push(id);
        showToast(`Added "${title}" to Wishlist.`);
      }
      setWishlist(list);
      localStorage.setItem("vrix-wishlist", JSON.stringify(list));
    } catch (err) {}
  };

  const handleQuickAdd = (p: any, variant: any) => {
    addItem({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle || p.type,
      price: variant?.price ?? p.price,
      image: variant?.image ?? p.image,
      material: variant?.material ?? p.material ?? "18K Gold Vermeil",
      stock: Number(variant?.stock ?? p.stock ?? 999),
    });
    showToast(`Added "${p.title}" to Bag!`);
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

  // Filter collections and products based on admin layout options
  const featuredCollectionsList = useMemo(() => {
    const ids = store.homepage.featuredCollections || [];
    if (ids.length === 0) return [];
    return ids
      .map((id: string) => store.collections.find((c: any) => String(c.id) === String(id)))
      .filter(Boolean);
  }, [store.homepage.featuredCollections, store.collections]);

  const newArrivalsList = useMemo(() => {
    const ids = store.homepage.newArrivals || [];
    if (ids.length === 0) return [];
    return ids
      .map((id: string) => allProducts.find((p: any) => String(p.id) === String(id)))
      .filter(Boolean);
  }, [store.homepage.newArrivals, allProducts]);

  const featuredProductsList = useMemo(() => {
    const ids = store.homepage.featuredProducts || [];
    if (ids.length === 0) return [];
    return ids
      .map((id: string) => allProducts.find((p: any) => String(p.id) === String(id)))
      .filter(Boolean);
  }, [store.homepage.featuredProducts, allProducts]);

  // Carousel settings from CMS (admin panel)
  const carouselSettings = useMemo(() => {
    return store.homepage.carouselSettings || DEFAULT_DATA.homepage.carouselSettings;
  }, [store.homepage.carouselSettings]);

  // 1. Categories Carousel
  const [categoryRef, categoryApi] = useEmblaCarousel(
    { loop: carouselSettings.categoryLoop !== false, align: "start" },
    [Autoplay({ delay: 3500, stopOnMouseEnter: true, stopOnInteraction: false })]
  );

  // 2. Collections Carousel
  const collectionsPlugins = useMemo(() => {
    return carouselSettings.collectionsAutoScroll
      ? [Autoplay({ delay: carouselSettings.collectionsInterval || 3500, stopOnMouseEnter: true, stopOnInteraction: false })]
      : [];
  }, [carouselSettings.collectionsAutoScroll, carouselSettings.collectionsInterval]);

  const [collectionsRef, collectionsApi] = useEmblaCarousel(
    { loop: carouselSettings.collectionsLoop !== false, align: "start" },
    collectionsPlugins
  );

  // 3. New Arrivals Carousel
  const newArrivalsPlugins = useMemo(() => {
    return carouselSettings.newArrivalsAutoScroll
      ? [Autoplay({ delay: carouselSettings.newArrivalsInterval || 4000, stopOnMouseEnter: true, stopOnInteraction: false })]
      : [];
  }, [carouselSettings.newArrivalsAutoScroll, carouselSettings.newArrivalsInterval]);

  const [newArrivalsRef, newArrivalsApi] = useEmblaCarousel(
    { loop: carouselSettings.newArrivalsLoop !== false, align: "start" },
    newArrivalsPlugins
  );

  // 4. Featured Products Carousel
  const featuredPlugins = useMemo(() => {
    return carouselSettings.featuredAutoScroll
      ? [Autoplay({ delay: carouselSettings.featuredInterval || 4500, stopOnMouseEnter: true, stopOnInteraction: false })]
      : [];
  }, [carouselSettings.featuredAutoScroll, carouselSettings.featuredInterval]);

  const [featuredRef, featuredApi] = useEmblaCarousel(
    { loop: carouselSettings.featuredLoop !== false, align: "start" },
    featuredPlugins
  );

  // Refs for animations
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Feature 9: GSAP reveals for homepage sections
  useGSAP(() => {
    if (loading) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const sections = gsap.utils.toArray(".reveal-section");
      sections.forEach((sec: any) => {
        gsap.fromTo(
          sec,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sec,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });

    return () => {
      mm.revert();
    };
  }, { dependencies: [loading], scope: pageContainerRef });

  return (
    <div ref={pageContainerRef} className="w-full relative bg-pure-white text-ink-black overflow-hidden select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-deep-navy text-pure-white px-6 py-3 font-body-md text-xs tracking-wider shadow-lg flex items-center justify-between gap-4 animate-fade-in max-w-sm rounded-xs border border-white/10">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── Hero Section ─── */}
      {(loading || slides.length > 0) && (
        <section className="relative h-[819px] md:h-screen w-full flex items-center bg-[#EBEAE4] overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 z-0">
              <Skeleton height="100%" borderRadius="0px" containerClassName="w-full h-full block" />
            </div>
          ) : (
            slides.map((slide: any, sIdx: number) => (
              <div
                key={sIdx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${sIdx === activeSlide ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0 pointer-events-none"
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
                <div className="absolute inset-0 bg-black/5" />

                <div className="relative z-10 h-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full flex items-center">
                  <div className="max-w-xl text-pure-white">
                    <p className="font-label-caps text-label-caps mb-stack-md tracking-widest uppercase opacity-90">
                      <FormattedText text={slide.subtitle} />
                    </p>
                    <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-lg leading-tight uppercase font-light">
                      <FormattedText
                        text={slide.title}
                        highlightClass="font-chancery normal-case font-normal italic text-blue-900 text-3xl md:text-5xl lg:text-6xl px-1 tracking-wide"
                      />
                    </h1>
                    <Link
                      href={slide.link || "/collections/silent-center"}
                      className="inline-block font-button text-button uppercase px-8 py-3 border border-pure-white text-pure-white hover:bg-pure-white hover:text-deep-navy transition-colors duration-300 cursor-pointer tracking-wider"
                    >
                      {slide.linkText || "Discover Collections"}
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Carousel indicator dots */}
          {!loading && slides.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2.5">
              {slides.map((_: any, sIdx: number) => (
                <button
                  key={sIdx}
                  onClick={() => setActiveSlide(sIdx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${sIdx === activeSlide ? "bg-ink-black md:bg-pure-white scale-125" : "bg-ink-black/40 md:bg-pure-white/40 hover:bg-ink-black/70 md:hover:bg-pure-white/70"
                    }`}
                  aria-label={`Go to slide ${sIdx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Collections Section ─── */}
      {(loading || featuredCollectionsList.length > 0) && (
        <section className="reveal-section py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex items-end justify-between mb-section-gap">
            <div>
              <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
                Our Collections
              </p>
              <h2 className="font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
                {loading ? <Skeleton width={280} /> : store.homepage.tagline}
              </h2>
            </div>
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
            <div className="relative group/carousel">
              <div ref={collectionsRef} className="overflow-hidden w-full">
                <div className="flex -ml-product-gap embla__container">
                  {featuredCollectionsList.map((col: any) => (
                    <div key={col.id} className="w-1/2 lg:w-1/4 pl-product-gap shrink-0 snap-start flex flex-col embla__slide">
                      <Link
                        href={col.link || `/collections/silent-center?collection=${col.id}`}
                        className="group cursor-pointer flex flex-col h-full"
                      >
                        <div className="aspect-[4/5] bg-soft-linen mb-stack-md overflow-hidden relative border border-slate-grey/10 rounded-xs">
                          <SkeletonImage
                            alt={`${col.title} Collection`}
                            fill
                            className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                            src={col.image}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                        <div className="text-center mt-1">
                          <h3 className="font-label-caps text-label-caps text-deep-navy uppercase mb-1 font-semibold">
                            {col.title}
                          </h3>
                          <p className="font-body-md text-slate-grey text-sm">
                            {col.tagline}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {featuredCollectionsList.length > 0 && (
                <>
                  <button
                    onClick={() => collectionsApi && collectionsApi.scrollPrev()}
                    className="absolute left-2 md:-left-5 top-[calc(50%-20px)] -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Previous collections"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => collectionsApi && collectionsApi.scrollNext()}
                    className="absolute right-2 md:-right-5 top-[calc(50%-20px)] -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Next collections"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </>
              )}
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

      {/* ─── Shop by Category Section ─── */}
      {(loading || (store.homepage.categories && store.homepage.categories.length > 0)) && (
        <section className="reveal-section py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="flex items-end justify-between mb-section-gap">
            <div>
              <p className="font-jost font-secondary font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
                Atelier Selections
              </p>
              <h2 className="font-inter font-primary font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
                Shop by Category
              </h2>
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
            <div className="relative group/carousel">
              <div ref={categoryRef} className="overflow-hidden w-full cursor-grab active:cursor-grabbing">
                <div className="flex -ml-3 embla__container">
                  {(store.homepage.categories || []).map((cat: any, idx: number) => (
                    <div key={idx} className="w-[180px] sm:w-1/3 lg:w-1/4 pl-3 shrink-0 embla__slide">
                      <Link href={cat.link} className="group relative aspect-square overflow-hidden border border-slate-grey/10 cursor-pointer block rounded shadow-xs">
                        <SkeletonImage
                          alt={cat.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          src={cat.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"}
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent flex items-end p-4 transition-opacity duration-300 group-hover:opacity-95">
                          <div className="w-full flex justify-between items-center text-pure-white">
                            <span className="font-label-caps text-xs tracking-widest uppercase font-semibold">{cat.title}</span>
                            <span className="material-symbols-outlined text-xs transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {(store.homepage.categories || []).length > 0 && (
                <>
                  <button
                    onClick={() => categoryApi && categoryApi.scrollPrev()}
                    className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Previous category"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button
                    onClick={() => categoryApi && categoryApi.scrollNext()}
                    className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Next category"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── New Arrivals Product Section ─── */}
      {(loading || newArrivalsList.length > 0) && (
        <section className="reveal-section py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="flex items-end justify-between mb-section-gap">
            <div>
              <p className="font-jost font-secondary font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
                Atelier Releases
              </p>
              <h2 className="font-inter font-primary font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
                New Arrivals
              </h2>
            </div>
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
            <div className="relative group/carousel">
              <div ref={newArrivalsRef} className="overflow-hidden w-full cursor-grab active:cursor-grabbing">
                <div className="flex -ml-3 embla__container">
                  {newArrivalsList.map((p: any, idx: number) => (
                    <div key={p.id} className="w-[200px] sm:w-1/3 lg:w-1/4 pl-3 shrink-0 flex flex-col embla__slide">
                      <ProductCard
                        product={p}
                        formatPrice={formatPrice}
                        isWishlisted={wishlist.includes(p.id)}
                        onWishlistToggle={toggleWishlist}
                        onQuickAdd={handleQuickAdd}
                        priority={idx < 4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {newArrivalsList.length > 0 && (
                <>
                  <button
                    onClick={() => newArrivalsApi && newArrivalsApi.scrollPrev()}
                    className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Previous new arrivals"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button
                    onClick={() => newArrivalsApi && newArrivalsApi.scrollNext()}
                    className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Next new arrivals"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── Featured Products Section ─── */}
      {(loading || featuredProductsList.length > 0) && (
        <section className="reveal-section py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop border-t border-slate-grey/15">
          <div className="flex items-end justify-between mb-section-gap">
            <div>
              <p className="font-jost font-secondary font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
                Curated Atelier Picks
              </p>
              <h2 className="font-inter font-primary font-headline-md text-headline-md text-deep-navy font-light uppercase tracking-wider">
                Featured Products
              </h2>
            </div>
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
            <div className="relative group/carousel">
              <div ref={featuredRef} className="overflow-hidden w-full cursor-grab active:cursor-grabbing">
                <div className="flex -ml-3 embla__container">
                  {featuredProductsList.map((p: any, idx: number) => (
                    <div key={p.id} className="w-[200px] sm:w-1/3 lg:w-1/4 pl-3 shrink-0 flex flex-col embla__slide">
                      <ProductCard
                        product={p}
                        formatPrice={formatPrice}
                        isWishlisted={wishlist.includes(p.id)}
                        onWishlistToggle={toggleWishlist}
                        onQuickAdd={handleQuickAdd}
                        priority={idx < 4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {featuredProductsList.length > 0 && (
                <>
                  <button
                    onClick={() => featuredApi && featuredApi.scrollPrev()}
                    className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Previous featured products"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button
                    onClick={() => featuredApi && featuredApi.scrollNext()}
                    className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-slate-grey/30 flex items-center justify-center text-ink-black hover:bg-ink-black hover:text-white transition-all cursor-pointer shadow-md bg-white/95"
                    aria-label="Next featured products"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── Brand Philosophy / Features ─── */}
      {(loading || (store.homepage.philosophy && store.homepage.philosophy.length > 0)) && (
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
                : store.homepage.philosophy.map((item: any, index: number) => (
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
      )}

      {/* ─── SEO Editorial Section (Chancery Font & Minimalist Luxury Styling) ─── */}
      <section className="bg-soft-linen/20 py-16 md:py-20 border-t border-slate-grey/15">
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center space-y-4">
          <p className="font-label-caps text-xs text-slate-grey uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-slate-grey/30 inline-block" />
            <span>{store.homepage.seoSubheading || "Luxury Minimalist Jewellery & Lab-Grown Diamonds"}</span>
            <span className="w-8 h-[1px] bg-slate-grey/30 inline-block" />
          </p>
          <h2 className="font-chancery text-2xl md:text-3xl lg:text-4xl text-deep-navy font-normal tracking-wide">
            {store.homepage.seoHeading || "A Luxury That Feels Like You"}
          </h2>
          <p className="font-body-md text-xs md:text-sm text-slate-grey/90 leading-relaxed text-justify md:text-center max-w-3xl mx-auto tracking-wide">
            {store.homepage.seoText ||
              "Welcome to VRIX — where luxury feels like you. Designed for those beginning their journey into fine jewellery, our collections blend lab-grown diamond artistry with architectural minimalism and high-quality craftsmanship. Positioned between gold-plated and heavy traditional gold jewellery, VRIX brings you quiet luxury, clean forms, and effortless elegance crafted to create a personal, meaningful connection for your everyday moments."}
          </p>
        </div>
      </section>
    </div>
  );
}
