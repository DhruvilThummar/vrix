"use client";

import Link from "next/link";
import Image from "next/image";
import SkeletonImage from "@/components/shop/SkeletonImage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchDb, fetchProducts, getWishlistKey } from "@/utils/api";
import { searchProducts } from "@/utils/productSearch";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import AuthDrawer from "@/components/auth/AuthDrawer";
import { useCurrency } from "@/context/CurrencyContext";
import { Select, SelectRootChangeEventDetails } from "@base-ui/react/select";
import "flag-icons/css/flag-icons.min.css";

const DEFAULT_LINKS: any[] = [
  {
    label: "Rings",
    path: "/rings",
  },
  {
    label: "Necklaces",
    path: "/necklaces",
  },
  {
    label: "Earrings",
    path: "/earrings",
  },
  {
    label: "Bracelets",
    path: "/bracelets",
  },
  {
    label: "Collections",
    path: "/collections",
  },
  {
    label: "Categories",
    path: "/categories",
  },
  {
    label: "Bespoke",
    path: "/bespoke",
  },
];


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { items: cartItems, totalItems, subtotal, removeItem, updateQty, addItem, isGiftWrapped, toggleGiftWrap, giftWrapPrice, selectedGiftOptions, toggleGiftOption } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { currency, setCurrency: changeCurrency, formatPrice } = useCurrency();

  const isHomePage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<any | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);


  // Navigation states
  const [navLinks, setNavLinks] = useState<any[]>(DEFAULT_LINKS);
  const [logoUrl, setLogoUrl] = useState("/logos/black.png");
  const [brandName, setBrandName] = useState("VRIX");
  const [bespokeEnabled, setBespokeEnabled] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Transparent styling is intentionally desktop/home-only. All other pages get
  // an opaque header so page content cannot show through the navigation.
  const isTransparent = isHomePage && !scrolled;
  const displayLogo = isTransparent
    ? "/logos/white.png"
    : (logoUrl.includes("white.png") ? "/logos/black.png" : logoUrl);

  // Announcement Bar State
  const [announcementBar, setAnnouncementBar] = useState<any>({
    isEnabled: true,
    interval: 3000,
    backgroundColor: "#000000",
    textColor: "#ffffff",
    fontSize: "11px",
    lines: []
  });
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(true);
  const [expandedMobileIndices, setExpandedMobileIndices] = useState<number[]>([]);

  const toggleMobileAccordion = (idx: number) => {
    setExpandedMobileIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };


  useEffect(() => {
    if (!announcementBar || !announcementBar.isEnabled || !announcementBar.lines || announcementBar.lines.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % announcementBar.lines.length);
    }, announcementBar.interval || 3000);

    return () => clearInterval(timer);
  }, [announcementBar]);

  useEffect(() => {
    setCurrentLineIndex(0);
  }, [announcementBar?.lines?.length]);

  // Drawer States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Wishlist state
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial DB configs
    fetchDb()
      .then((res) => {
        if (Array.isArray(res.collections)) {
          setCollections(res.collections.filter((col: any) => col.isVisible !== false));
        }
        if (res.announcement_bar) {
          setAnnouncementBar(res.announcement_bar);
        }
        if (res.brand) {
          if (res.brand.name) setBrandName(res.brand.name);
          if (res.brand.logoUrl) setLogoUrl(res.brand.logoUrl);
        }
        if (res.features && res.features.bespokeEnabled !== undefined) {
          setBespokeEnabled(res.features.bespokeEnabled);
        }
        if (Array.isArray(res.navigation) && res.navigation.length > 0) {
          const links = [...res.navigation];
          const hasVrixPlus = links.some(link => link.path === "/vrix-plus" || link.label === "VRIX+");
          if (!hasVrixPlus) {
            links.push({ label: "VRIX+", path: "/vrix-plus" });
          }
          setNavLinks(links);
        } else {
          setNavLinks(DEFAULT_LINKS);
        }
      })
      .catch((err) => console.error("Error loading header DB details:", err));

    // Fetch all products for search panel
    fetchProducts()
      .then((products) => {
        setAllProducts(products);
      })
      .catch((err) => console.error("Error loading products for search drawer:", err));
  }, []);

  // Load wishlist from localStorage per user email
  const loadWishlist = () => {
    try {
      const key = getWishlistKey(user?.email);
      const savedUserKey = localStorage.getItem(key);
      const fallbackKey = localStorage.getItem("vrix-wishlist");
      const savedIds = savedUserKey || fallbackKey;
      const ids = savedIds ? JSON.parse(savedIds) : [];
      if (ids.length > 0 && allProducts.length > 0) {
        setWishlist(allProducts.filter((p: any) => ids.includes(p.id)));
      } else {
        setWishlist([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Keep wishlist updated when drawer opens, products load, or user changes
  useEffect(() => {
    if (allProducts.length > 0) {
      loadWishlist();
    }
  }, [isWishlistOpen, allProducts, user?.email]);

  // Remove from wishlist helper
  const handleRemoveFromWishlist = (id: string) => {
    try {
      const key = getWishlistKey(user?.email);
      const savedIds = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      const ids = savedIds ? JSON.parse(savedIds) : [];
      const updated = ids.filter((wid: string) => wid !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      localStorage.setItem("vrix-wishlist", JSON.stringify(updated));
      loadWishlist();
    } catch (e) {
      console.error(e);
    }
  };

  // Move wishlist item to cart
  const handleMoveToCart = (item: any) => {
    if (Number(item.stock ?? 999) <= 0) return;
    addItem({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle || item.type,
      price: item.price,
      image: item.image,
      material: item.material || "Silver",
      size: "M",
      stock: Number(item.stock ?? 999),
    });
    handleRemoveFromWishlist(item.id);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  // Filtered search results
  const searchResults = useMemo(
    () => searchProducts(allProducts, searchQuery),
    [allProducts, searchQuery]
  );

  const predictiveResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { products: [], collections: [], categories: [] };

    const matchedProducts = searchProducts(allProducts, query).slice(0, 5);

    const matchedCollections = collections.filter((col) =>
      col.title.toLowerCase().includes(query) ||
      col.id.toLowerCase().includes(query)
    ).slice(0, 3);

    const allTypes = ["Necklaces", "Rings", "Earrings", "Bracelets", "Bespoke"];
    const matchedCategories = allTypes.filter((t) =>
      t.toLowerCase().includes(query)
    );

    return {
      products: matchedProducts,
      collections: matchedCollections,
      categories: matchedCategories
    };
  }, [searchQuery, allProducts, collections]);

  const isActive = (path: string, label?: string) => {
    if (!path || path === "#") return false;
    if (path === "/") {
      const isHomeLabel = label && /home/i.test(label);
      return isHomeLabel ? pathname === "/" : false;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <>
      {/* ─── ANNOUNCEMENT BAR — controlled by admin CMS ─── */}
      {announcementBar?.isEnabled && (
        <div
          style={{
            backgroundColor: announcementBar?.backgroundColor || "#000000",
            color: announcementBar?.textColor || "#ffffff",
            fontSize: announcementBar?.fontSize || "11px"
          }}
          className="w-full fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center font-label-caps tracking-widest uppercase border-b border-pure-white/10 transition-all duration-500 min-h-[32px] flex items-center justify-center gap-3 overflow-hidden"
        >
          {announcementBar?.lines && announcementBar.lines.length > 0 && (
            <div key={currentLineIndex} className="animate-fade-in-slide whitespace-nowrap flex items-center gap-2">
              <span>{announcementBar.lines[currentLineIndex]}</span>
              {announcementBar.showLink !== false && (
                <Link
                  href={announcementBar.actionLink || "/offers"}
                  className="underline underline-offset-2 hover:opacity-80 font-bold ml-1 cursor-pointer"
                >
                  {announcementBar.actionText || "Shop Offers →"}
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── DESKTOP NAVIGATION ─── */}
      <header className={`shop-desktop-header hidden md:block fixed ${announcementBar?.isEnabled ? "top-8" : "top-0"} left-0 right-0 z-40 transition-all duration-500 ease-out ${isTransparent ? "shop-desktop-header--transparent" : ""}`}>
        {/* Brand Banner Row */}
        <div className="w-full max-w-container-max mx-auto px-margin-desktop py-4 grid grid-cols-3 items-center">
          {/* Left space */}
          <div className="header-member-info flex justify-start text-xs font-label-caps">
            {isLoggedIn && user?.isVrixPlusMember && (
              <Link href="/vrix-plus" className="header-member-link flex items-center gap-1.5 font-semibold hover:opacity-85 transition-opacity">
                <span className="material-symbols-outlined text-[15px] font-bold animate-pulse">stars</span>
                VRIX+ ACTIVE MEMBER
              </Link>
            )}
          </div>

          {/* Center Brand Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              {displayLogo && displayLogo !== "" ? (
                <div className="relative h-8 w-32">
                  <Image
                    src={displayLogo}
                    alt={brandName}
                    fill
                    className="object-contain"
                    sizes="128px"
                    priority
                  />
                </div>
              ) : (
                <span className="header-brand-text font-logo text-3xl font-light tracking-[0.25em] uppercase select-none hover:opacity-80 transition-opacity">
                  {brandName}
                </span>
              )}
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex justify-end items-center gap-6">
            <Select.Root
              value={currency}
              onValueChange={(val: string | null) => {
                if (val) changeCurrency(val as any);
              }}
            >
              <Select.Trigger className="header-currency text-xs font-semibold uppercase tracking-wider outline-none cursor-pointer border-none mr-2 bg-transparent flex items-center gap-1.5 focus:outline-none">
                <Select.Value>
                  {currency === "INR" && <span className="fi fi-in" />}
                  {currency === "USD" && <span className="fi fi-us" />}
                  {currency === "EUR" && <span className="fi fi-eu" />}
                  {currency === "GBP" && <span className="fi fi-gb" />}
                  <span className="ml-1">{currency}</span>
                </Select.Value>
                <Select.Icon className="material-symbols-outlined text-[14px]">expand_more</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner className="z-50 mt-1">
                  <Select.Popup className="bg-pure-white border border-slate-grey/20 shadow-xl py-1 flex flex-col min-w-[100px] outline-none">
                    <Select.Item value="INR" className="px-3 py-1.5 text-xs text-ink-black hover:bg-soft-linen cursor-pointer flex items-center gap-2 focus:outline-none">
                      <span className="fi fi-in" />
                      <span>INR (₹)</span>
                    </Select.Item>
                    <Select.Item value="USD" className="px-3 py-1.5 text-xs text-ink-black hover:bg-soft-linen cursor-pointer flex items-center gap-2 focus:outline-none">
                      <span className="fi fi-us" />
                      <span>USD ($)</span>
                    </Select.Item>
                    <Select.Item value="EUR" className="px-3 py-1.5 text-xs text-ink-black hover:bg-soft-linen cursor-pointer flex items-center gap-2 focus:outline-none">
                      <span className="fi fi-eu" />
                      <span>EUR (€)</span>
                    </Select.Item>
                    <Select.Item value="GBP" className="px-3 py-1.5 text-xs text-ink-black hover:bg-soft-linen cursor-pointer flex items-center gap-2 focus:outline-none">
                      <span className="fi fi-gb" />
                      <span>GBP (£)</span>
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="header-action p-1 transition-colors duration-300 cursor-pointer flex items-center justify-center"
              aria-label="Search Catalog"
            >
              <i className="fa-solid fa-magnifying-glass text-[18px]"></i>
            </button>
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="header-action p-1 transition-colors duration-300 cursor-pointer flex items-center justify-center relative"
              aria-label="View Wishlist"
            >
              <i className="fa-regular fa-heart text-[19px]"></i>
              {wishlist.length > 0 && (
                <span className="header-count absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="header-action p-1 transition-colors duration-300 cursor-pointer flex items-center justify-center"
              aria-label="User Account"
            >
              <i className="fa-regular fa-user text-[19px]"></i>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="header-action p-1 transition-colors duration-300 cursor-pointer flex items-center justify-center relative"
              aria-label="Open Shopping Bag"
            >
              <i className="fa-solid fa-bag-shopping text-[19px]"></i>
              {totalItems > 0 && (
                <span className="header-count absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Links Navigation Row */}
        <div
          className="header-nav-row w-full py-3 transition-all duration-500 relative"
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <nav className="flex justify-center gap-8 items-center max-w-container-max mx-auto px-margin-desktop">
            {navLinks.map((link, idx) => {
              const megaMenuData = link.megaMenu;
              return (
                <div key={idx} className="py-1">
                  <Link
                    href={link.path}
                    onMouseEnter={() => {
                      if (megaMenuData) {
                        setActiveMegaMenu(megaMenuData);
                      } else {
                        setActiveMegaMenu(null);
                      }
                    }}
                    className={`font-label-caps text-xs tracking-[0.15em] uppercase py-1 header-nav-link inline-block relative ${isActive(link.path, link.label) ? "header-nav-link--active" : ""}`}
                  >
                    {(link.path === "/bespoke" || link.path.includes("bespoke")) && !bespokeEnabled ? `${link.label} (Waitlist)` : link.label}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Premium Glassmorphic Mega Menu */}
          {activeMegaMenu && (
            <div
              className="header-mega-menu absolute top-full left-0 right-0 border-b shadow-lg animate-fade-in z-50"
              onMouseEnter={() => setActiveMegaMenu(activeMegaMenu)}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <div className="max-w-container-max mx-auto px-margin-desktop py-8 grid grid-cols-4 gap-8">
                {/* Categories */}
                <div className="col-span-3 grid grid-cols-3 gap-6">
                  {activeMegaMenu.categories.map((cat: any, cIdx: number) => (
                    <div key={cIdx} className="space-y-4">
                      <h4 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2">
                        {cat.title}
                      </h4>
                      <ul className="space-y-2">
                        {cat.links.map((lnk: any, lIdx: number) => (
                          <li key={lIdx}>
                            <Link
                              href={lnk.path}
                              onClick={() => setActiveMegaMenu(null)}
                              className="font-body-md text-xs text-slate-grey hover:text-ink-black transition-colors block py-0.5"
                            >
                              {lnk.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Featured Promo Banner */}
                {activeMegaMenu.featured && (
                  <div className="col-span-1 border-l border-slate-grey/15 pl-8 space-y-3">
                    <h4 className="font-label-caps text-[9px] text-slate-grey tracking-widest uppercase">
                      Featured
                    </h4>
                    <Link
                      href={activeMegaMenu.featured.link}
                      onClick={() => setActiveMegaMenu(null)}
                      className="group block space-y-2"
                    >
                      <div className="relative aspect-video w-full bg-soft-linen overflow-hidden">
                        <Image
                          src={activeMegaMenu.featured.image}
                          alt={activeMegaMenu.featured.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-label-caps text-xs text-ink-black font-semibold tracking-wider group-hover:text-deep-navy transition-colors">
                          {activeMegaMenu.featured.title}
                        </span>
                        <span className="material-symbols-outlined text-sm text-slate-grey group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── MOBILE NAVIGATION ─── */}
      <header 
        className={`md:hidden fixed ${
          announcementBar?.isEnabled ? "top-8" : "top-0"
        } left-0 right-0 z-40 transition-all duration-500 ease-out border-b px-margin-mobile py-4 grid grid-cols-3 items-center ${
          isTransparent 
            ? "bg-transparent text-white border-white/15" 
            : "bg-pure-white text-ink-black border-soft-linen shadow-sm"
        }`}
      >
        {/* Left: Hamburger menu */}
        <div className="flex justify-start">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="cursor-pointer flex items-center justify-center w-8 h-8"
            aria-label="Open Menu Drawer"
          >
            <i className="fa-solid fa-bars text-[20px]"></i>
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            {logoUrl && logoUrl !== "" ? (
              <div className="relative h-6 w-24">
                <Image
                  src={isTransparent ? "/logos/white.png" : (logoUrl.includes("white.png") ? "/logos/black.png" : logoUrl)}
                  alt={brandName}
                  fill
                  className="object-contain"
                  sizes="96px"
                  priority
                />
              </div>
            ) : (
              <span className="font-logo text-xl tracking-[0.2em] uppercase select-none">
                {brandName}
              </span>
            )}
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex justify-end gap-3 items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="cursor-pointer flex items-center justify-center w-8 h-8"
            aria-label="Open Search"
          >
            <i className="fa-solid fa-magnifying-glass text-[18px]"></i>
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="cursor-pointer flex items-center justify-center w-8 h-8 relative"
            aria-label="Open Cart Drawer"
          >
            <i className="fa-solid fa-bag-shopping text-[18px]"></i>
            {totalItems > 0 && (
              <span className={`absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${isTransparent ? "bg-white text-black" : "bg-black text-white"}`}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>


      {/* ══════════════════════════════════════════════════════════════════════════════
          DRAWERS (SIDE SLIDERS)
          ══════════════════════════════════════════════════════════════════════════════ */}

      {/* Overlay Backdrop */}
      {(isCartOpen || isWishlistOpen || isSearchOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => {
            setIsCartOpen(false);
            setIsWishlistOpen(false);
            setIsSearchOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* ─── CART DRAWER (RIGHT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-soft-linen flex justify-between items-center">
          <h3 className="font-label-caps text-sm tracking-widest font-semibold uppercase">Shopping Bag ({totalItems})</h3>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 text-slate-grey hover:text-ink-black transition-colors"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-slate-grey/30">shopping_bag</span>
              <p className="text-slate-grey font-body-md text-sm">Your shopping bag is currently empty.</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  router.push("/collections");
                }}
                className="px-6 py-2.5 bg-black text-white uppercase text-xs font-button tracking-wider hover:bg-black/90 transition-colors"
              >
                Shop New Arrivals
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id + (item.size || "")} className="flex gap-4 p-3 border border-soft-linen bg-surface/30">
                  <div className="w-20 h-24 bg-soft-linen relative shrink-0">
                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-label-caps text-xs uppercase font-semibold text-deep-navy pr-4">{item.title}</h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-grey hover:text-red-600 transition-colors"
                          aria-label="Remove item"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-grey uppercase tracking-wider mt-0.5">{item.subtitle || "Fine Jewelry"}</p>
                      <p className="text-[9px] text-slate-grey/70">{item.material}</p>
                      {item.size && (
                        <p className="text-[10px] text-slate-grey uppercase tracking-wider">Size: {item.size}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      {/* Qty edit */}
                      <div className="flex items-center border border-soft-linen bg-pure-white">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-grey hover:text-ink-black"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-grey hover:text-ink-black"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-body-md text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Promo Ads Carousel ("Frequently Paired With") */}
          {allProducts.length > 0 && (
            <div className="pt-4 border-t border-soft-linen space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                  Frequently Paired With
                </span>
                <span className="text-[9px] text-amber-700 font-label-caps uppercase font-bold bg-amber-50 px-2 py-0.5 border border-amber-200">
                  ★ Special Offer
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {allProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="w-36 shrink-0 p-2.5 border border-soft-linen bg-surface/30 flex flex-col justify-between space-y-2 hover:border-black/30 transition-colors"
                  >
                    <div className="relative aspect-square bg-soft-linen">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover mix-blend-multiply"
                        sizes="120px"
                      />
                    </div>
                    <div>
                      <p className="font-label-caps text-[10px] uppercase font-semibold text-deep-navy truncate">
                        {p.title}
                      </p>
                      <p className="font-body-md text-xs font-semibold mt-0.5">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (Number(p.stock ?? 999) <= 0) return;
                        addItem({
                          id: p.id,
                          title: p.title,
                          subtitle: p.subtitle || p.type,
                          price: p.price,
                          image: p.image,
                          material: p.material || "18K Gold Vermeil",
                          stock: Number(p.stock ?? 999),
                        });
                      }}
                      disabled={Number(p.stock ?? 999) <= 0}
                      className="w-full py-1.5 bg-black text-white text-[9px] font-button uppercase tracking-wider hover:bg-black/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {Number(p.stock ?? 999) <= 0 ? "Out of Stock" : "+ Add to Bag"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-soft-linen bg-surface/30 space-y-4">

            {/* Gift Wrapping Quick Option */}
            <button
              type="button"
              onClick={() => toggleGiftWrap(!isGiftWrapped, 250)}
              className={`group relative flex flex-col p-3 border cursor-pointer text-left transition-all duration-200 w-full rounded ${isGiftWrapped
                  ? "bg-deep-navy text-pure-white border-deep-navy shadow-md translate-y-[-1px]"
                  : "bg-pure-white text-ink-black border-slate-grey/30 hover:border-deep-navy"
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`material-symbols-outlined text-lg ${isGiftWrapped ? "text-amber-300" : "text-amber-600"}`}>
                  card_giftcard
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isGiftWrapped ? "bg-amber-400" : "bg-slate-300"}`}></span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className={`font-label-caps text-[10px] tracking-wider line-clamp-1 font-medium ${isGiftWrapped ? "text-pure-white" : "text-deep-navy"}`}>
                  Gift Wrapping
                </span>
                <span className={`text-[10px] font-semibold ${isGiftWrapped ? "text-amber-300" : "text-emerald-700"}`}>
                  {isGiftWrapped ? "Added" : `+${formatPrice(giftWrapPrice)}`}
                </span>
              </div>
            </button>

            <div className="space-y-1 text-xs">
              {isGiftWrapped && (
                <div className="flex justify-between items-center text-slate-grey font-label-caps text-[11px]">
                  <span>Signature Gift Packaging</span>
                  <span className="font-semibold text-deep-navy">+{formatPrice(giftWrapPrice)}</span>
                </div>
              )}
              {selectedGiftOptions.map((g) => (
                <div key={g.id} className="flex justify-between items-center text-slate-grey font-label-caps text-[11px]">
                  <span className="truncate pr-2">{g.title}</span>
                  <span className="font-semibold text-deep-navy shrink-0">+{formatPrice(g.price)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm font-semibold text-deep-navy pt-1 border-t border-slate-grey/10">
                <span className="font-label-caps">Total</span>
                <span className="font-body-md text-base">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-grey leading-relaxed">
              Shipping & taxes calculated at checkout. Enjoy complimentary signature packaging options on all orders.
            </p>

            <button
              onClick={() => {
                setIsCartOpen(false);
                router.push("/checkout/shipping");
              }}
              className="w-full py-4 bg-black text-white text-center uppercase tracking-widest text-xs font-button hover:bg-black/90 transition-colors shadow-md cursor-pointer rounded"
            >
              Secure Checkout
            </button>
          </div>
        )}
      </div>

      {/* ─── WISHLIST DRAWER (RIGHT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${isWishlistOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 border-b border-soft-linen flex justify-between items-center">
          <h3 className="font-label-caps text-sm tracking-widest font-semibold uppercase">My Wishlist ({wishlist.length})</h3>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1 text-slate-grey hover:text-ink-black transition-colors"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-slate-grey/30">favorite</span>
              <p className="text-slate-grey font-body-md text-sm">Your wishlist is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wishlist.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 border border-soft-linen bg-surface/30">
                  <div className="w-20 h-24 bg-soft-linen relative shrink-0">
                    <SkeletonImage src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-label-caps text-xs uppercase font-semibold text-deep-navy pr-4">{item.title}</h4>
                        <button
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          className="text-slate-grey hover:text-red-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-grey uppercase tracking-wider mt-0.5">{item.subtitle || "Fine Jewelry"}</p>
                      <p className="text-[9px] text-slate-grey/70">{item.material}</p>
                      <p className="font-body-md text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="w-full py-2 bg-black text-white text-[10px] uppercase font-button tracking-wider hover:bg-black/90 transition-colors"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SEARCH DRAWER (RIGHT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${isSearchOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 border-b border-soft-linen flex justify-between items-center">
          <h3 className="font-label-caps text-sm tracking-widest font-semibold uppercase">Search Catalog</h3>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className="p-1 text-slate-grey hover:text-ink-black transition-colors"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>

        <div className="p-6 bg-surface/30 border-b border-soft-linen">
          <div className="relative flex items-center border-b border-slate-grey/30 focus-within:border-deep-navy pb-1">
            <span className="material-symbols-outlined text-slate-grey mr-2 text-[20px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections, metal type, earrings..."
              className="w-full bg-transparent border-none outline-none font-body-md text-sm text-ink-black"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-grey hover:text-ink-black"
              >
                <span className="material-symbols-outlined text-[16px]">clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {searchQuery.trim() === "" ? (
            <div className="space-y-4">
              <h4 className="font-label-caps text-[10px] text-slate-grey tracking-widest uppercase">Popular Categories</h4>
              <div className="flex flex-wrap gap-2">
                {["Necklaces", "Earrings", "Rings", "Bracelets", "Bespoke"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearchQuery(cat)}
                    className="px-3.5 py-1.5 border border-soft-linen text-xs text-ink-black/80 hover:bg-black hover:text-white transition-all rounded-xs cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ) : predictiveResults.products.length === 0 &&
            predictiveResults.collections.length === 0 &&
            predictiveResults.categories.length === 0 ? (
            <p className="text-center text-slate-grey font-body-md text-sm py-12">No results found for "{searchQuery}".</p>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Categories segment */}
              {predictiveResults.categories.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-label-caps text-[9px] text-slate-grey tracking-widest uppercase border-b border-slate-grey/10 pb-1.5">
                    Suggested Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {predictiveResults.categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/collections/silent-center?type=${cat.toLowerCase()}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="px-3 py-1 bg-soft-linen/35 border border-slate-grey/15 text-xs text-ink-black uppercase font-label-caps hover:bg-deep-navy hover:text-pure-white transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Collections segment */}
              {predictiveResults.collections.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-label-caps text-[9px] text-slate-grey tracking-widest uppercase border-b border-slate-grey/10 pb-1.5">
                    Matching Collections
                  </h4>
                  <div className="flex flex-col gap-2">
                    {predictiveResults.collections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex justify-between items-center py-2 px-3 border border-slate-grey/15 bg-soft-linen/10 hover:bg-soft-linen/25 transition-colors cursor-pointer"
                      >
                        <span className="font-label-caps text-xs font-semibold text-deep-navy uppercase">{col.title}</span>
                        <span className="material-symbols-outlined text-sm text-slate-grey">arrow_forward</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products segment */}
              {predictiveResults.products.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-label-caps text-[9px] text-slate-grey tracking-widest uppercase border-b border-slate-grey/10 pb-1.5">
                    Matched Products
                  </h4>
                  <div className="space-y-3">
                    {predictiveResults.products.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex gap-4 p-2 border border-soft-linen hover:border-slate-grey/30 bg-surface/10 hover:bg-surface/50 transition-all cursor-pointer"
                      >
                        <div className="w-14 h-16 bg-soft-linen relative shrink-0">
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="50px" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h5 className="font-label-caps text-xs font-semibold uppercase text-deep-navy leading-none mb-1">{item.title}</h5>
                          <span className="text-[10px] text-slate-grey uppercase tracking-wider">{item.subtitle || item.type}</span>
                          <span className="font-body-md text-xs font-semibold mt-1">${item.price}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MOBILE DRAWER (LEFT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] w-[320px] max-w-[88vw] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-soft-linen flex justify-between items-center bg-pure-white shrink-0">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
            {displayLogo && displayLogo !== "" ? (
              <div className="relative h-6 w-24">
                <Image
                  src={displayLogo.includes("white.png") ? "/logos/black.png" : displayLogo}
                  alt={brandName}
                  fill
                  className="object-contain"
                  sizes="96px"
                  priority
                />
              </div>
            ) : (
              <span className="font-logo text-xl tracking-[0.2em] uppercase text-ink-black select-none">
                {brandName}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-grey hover:text-ink-black transition-colors cursor-pointer rounded-full hover:bg-soft-linen/50"
            aria-label="Close Menu Drawer"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>
        {/* Scrollable Navigation Body */}
        <div className="flex-grow overflow-hidden relative">
          {/* Main Menu Panel */}
          <div 
            className={`absolute inset-0 overflow-y-auto px-4 py-3 space-y-1.5 transition-transform duration-300 ease-out ${
              activeMegaMenu ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <nav className="flex flex-col font-label-caps text-sm uppercase tracking-widest divide-y divide-soft-linen/60">
              {navLinks.map((link, idx) => {
                const hasSubmenu = Boolean(
                  link.megaMenu?.categories ||
                  link.label.toLowerCase().includes("collection") ||
                  link.path.includes("collection")
                );

                return (
                  <div key={idx} className="py-2.5">
                    <div className="flex justify-between items-center">
                      {hasSubmenu ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (link.megaMenu) {
                              setActiveMegaMenu({
                                title: link.label,
                                ...link.megaMenu
                              });
                            } else {
                              // Default collections submenu mock
                              setActiveMegaMenu({
                                title: link.label,
                                categories: [
                                  {
                                    title: "Shop By Category",
                                    links: [
                                      { label: "All Rings", path: "/collections/silent-center?type=ring" },
                                      { label: "Necklaces & Pendants", path: "/collections/silent-center?type=necklace" },
                                      { label: "Earrings", path: "/collections/silent-center?type=earring" },
                                      { label: "Bracelets & Cuffs", path: "/collections/silent-center?type=bracelet" },
                                      { label: "Special Offers & Deals ★", path: "/offers" }
                                    ]
                                  }
                                ]
                              });
                            }
                          }}
                          className="flex-grow text-left font-label-caps text-sm uppercase tracking-wider text-ink-black hover:text-deep-navy font-medium flex items-center justify-between py-1 cursor-pointer"
                        >
                          <span>
                            {(link.path === "/bespoke" || link.path.includes("bespoke")) && !bespokeEnabled
                              ? `${link.label} (Waitlist)`
                              : link.label}
                          </span>
                          <span className="material-symbols-outlined text-xl text-slate-grey">
                            chevron_right
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block w-full py-1 font-label-caps text-sm uppercase tracking-wider transition-colors ${isActive(link.path, link.label)
                              ? "text-deep-navy font-semibold"
                              : "text-ink-black/80 hover:text-ink-black"
                            }`}
                        >
                          {(link.path === "/bespoke" || link.path.includes("bespoke")) && !bespokeEnabled
                            ? `${link.label} (Waitlist)`
                            : link.label}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Submenu Slide-in Panel */}
          <div 
            className={`absolute inset-0 bg-pure-white overflow-y-auto px-4 py-3 space-y-4 transition-transform duration-300 ease-out flex flex-col ${
              activeMegaMenu ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Back Button */}
            <div className="flex items-center border-b border-soft-linen pb-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMegaMenu(null)}
                className="flex items-center gap-1 text-xs font-label-caps text-deep-navy hover:text-black cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back to Menu</span>
              </button>
              <span className="ml-auto font-label-caps text-xs font-bold text-ink-black tracking-widest uppercase">
                {activeMegaMenu?.title}
              </span>
            </div>

            {/* Submenu Links List */}
            <div className="flex-grow space-y-5">
              {activeMegaMenu?.categories?.map((cat: any, cIdx: number) => (
                <div key={cIdx} className="space-y-2">
                  <h4 className="font-label-caps text-[10px] text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-1">
                    {cat.title}
                  </h4>
                  <ul className="space-y-1.5 pl-1.5">
                    {cat.links?.map((lnk: any, lIdx: number) => (
                      <li key={lIdx}>
                        <Link
                          href={lnk.path}
                          onClick={() => {
                            setActiveMegaMenu(null);
                            setIsMobileMenuOpen(false);
                          }}
                          className="font-body-md text-xs text-slate-grey hover:text-ink-black transition-colors block py-0.5"
                        >
                          {lnk.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Submenu Featured Block */}
              {activeMegaMenu?.featured && (
                <div className="border-t border-slate-grey/15 pt-4 space-y-2">
                  <h5 className="font-label-caps text-[9px] text-slate-grey tracking-widest uppercase">Featured</h5>
                  <Link
                    href={activeMegaMenu.featured.link}
                    onClick={() => {
                      setActiveMegaMenu(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block space-y-2 group"
                  >
                    <div className="relative aspect-video w-full bg-soft-linen overflow-hidden">
                      <Image
                        src={activeMegaMenu.featured.image}
                        alt={activeMegaMenu.featured.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-xs text-ink-black font-semibold tracking-wider">
                        {activeMegaMenu.featured.title}
                      </span>
                      <span className="material-symbols-outlined text-sm text-slate-grey">arrow_forward</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Bottom Action Bar */}
        <div className="mt-auto border-t border-soft-linen p-2.5 bg-soft-linen/25 shrink-0 space-y-2">
          {/* Currency Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-pure-white border border-slate-grey/20 rounded-xs gap-2">
            <span className="text-[9px] font-label-caps uppercase text-slate-grey tracking-widest shrink-0">Currency</span>
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value as any)}
              className="bg-transparent text-[11px] font-semibold uppercase tracking-wider text-ink-black outline-none cursor-pointer min-w-0"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthOpen(true);
              }}
              className="flex flex-col items-center justify-center py-2 px-1 border border-slate-grey/15 bg-pure-white hover:border-slate-grey/40 transition-colors cursor-pointer"
            >
              <i className="fa-regular fa-user text-sm text-ink-black"></i>
              <span className="text-[8px] uppercase font-label-caps mt-0.5 text-slate-grey tracking-wider">Account</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsWishlistOpen(true);
              }}
              className="flex flex-col items-center justify-center py-2 px-1 border border-slate-grey/15 bg-pure-white hover:border-slate-grey/40 transition-colors cursor-pointer relative"
            >
              <i className="fa-regular fa-heart text-sm text-ink-black"></i>
              <span className="text-[8px] uppercase font-label-caps mt-0.5 text-slate-grey tracking-wider">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-2 bg-deep-navy text-pure-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCartOpen(true);
              }}
              className="flex flex-col items-center justify-center py-2 px-1 border border-slate-grey/15 bg-pure-white hover:border-slate-grey/40 transition-colors cursor-pointer relative"
            >
              <i className="fa-solid fa-bag-shopping text-sm text-ink-black"></i>
              <span className="text-[8px] uppercase font-label-caps mt-0.5 text-slate-grey tracking-wider">Bag</span>
              {totalItems > 0 && (
                <span className="absolute top-1 right-2 bg-deep-navy text-pure-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Drawer Modal */}
      <AuthDrawer isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
