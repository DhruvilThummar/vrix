"use client";

import Link from "next/link";
import Image from "next/image";
import SkeletonImage from "@/components/shop/SkeletonImage";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchDb, fetchProducts } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import AuthDrawer from "@/components/auth/AuthDrawer";

const DEFAULT_LINKS = [
  { label: "Trending", path: "/collections/silent-center?filter=trending" },
  { label: "Necklaces", path: "/collections/silent-center?type=necklace" },
  { label: "Earrings", path: "/collections/silent-center?type=earrings" },
  { label: "Bracelets", path: "/collections/silent-center?type=bracelet" },
  { label: "Rings", path: "/collections/silent-center?type=rings" },
  { label: "Charms", path: "/collections/silent-center?type=charms" },
  { label: "Collection", path: "/collections" },
  { label: "Gifts", path: "/search?filter=gifts" },
  { label: "VRIX+", path: "/vrix-plus" }
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { items: cartItems, totalItems, subtotal, removeItem, updateQty, addItem } = useCart();
  const { user, isLoggedIn } = useAuth();

  // Navigation states
  const [navLinks, setNavLinks] = useState(DEFAULT_LINKS);
  const [logoUrl, setLogoUrl] = useState("/logos/black.png");
  const [brandName, setBrandName] = useState("VRIX");
  const [bespokeEnabled, setBespokeEnabled] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Announcement Bar State
  const [announcementBar, setAnnouncementBar] = useState<any>({
    isEnabled: true,
    interval: 3000,
    backgroundColor: "#000000",
    textColor: "#ffffff",
    fontSize: "11px",
    lines: [
      "Complimentary shipping on all orders",
      "Complimentary gift packaging",
      "30-day returns"
    ]
  });
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

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

  // Load wishlist from localStorage
  const loadWishlist = () => {
    try {
      const savedIds = localStorage.getItem("vrix-wishlist");
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

  // Keep wishlist updated when drawer opens or products load
  useEffect(() => {
    if (isWishlistOpen && allProducts.length > 0) {
      loadWishlist();
    }
  }, [isWishlistOpen, allProducts]);

  // Remove from wishlist helper
  const handleRemoveFromWishlist = (id: string) => {
    try {
      const savedIds = localStorage.getItem("vrix-wishlist");
      const ids = savedIds ? JSON.parse(savedIds) : [];
      const updated = ids.filter((wid: string) => wid !== id);
      localStorage.setItem("vrix-wishlist", JSON.stringify(updated));
      loadWishlist();
    } catch (e) {
      console.error(e);
    }
  };

  // Move wishlist item to cart
  const handleMoveToCart = (item: any) => {
    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      material: item.material || "Silver",
      size: "M"
    });
    handleRemoveFromWishlist(item.id);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.collection && p.collection.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.type && p.type.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ─── ANNOUNCEMENT BAR ─── */}
      {announcementBar && announcementBar.isEnabled && announcementBar.lines && announcementBar.lines.length > 0 && (
        <div
          style={{
            backgroundColor: announcementBar.backgroundColor || "#000000",
            color: announcementBar.textColor || "#ffffff",
            fontSize: announcementBar.fontSize || "11px"
          }}
          className="w-full py-2 px-4 text-center font-label-caps tracking-widest uppercase border-b border-pure-white/10 z-50 relative transition-all duration-500 min-h-[32px] flex items-center justify-center overflow-hidden"
        >
          <div key={currentLineIndex} className="animate-fade-in-slide whitespace-nowrap">
            {announcementBar.lines[currentLineIndex]}
          </div>
        </div>
      )}

      {/* ─── DESKTOP NAVIGATION ─── */}
      <header className="hidden md:block sticky top-0 z-40 bg-pure-white text-ink-black border-b border-soft-linen shadow-sm">
        {/* Brand Banner Row */}
        <div className="w-full max-w-container-max mx-auto px-margin-desktop py-4 grid grid-cols-3 items-center">
          {/* Left space */}
          <div className="flex justify-start text-xs text-slate-grey font-label-caps">
            {isLoggedIn && user?.isVrixPlusMember && (
              <Link href="/vrix-plus" className="flex items-center gap-1.5 text-deep-navy font-semibold hover:opacity-85 transition-opacity">
                <span className="material-symbols-outlined text-[15px] font-bold text-deep-navy animate-pulse">stars</span>
                VRIX+ ACTIVE MEMBER
              </Link>
            )}
          </div>

          {/* Center Brand Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              {logoUrl && logoUrl !== "" ? (
                <div className="relative h-8 w-32">
                  <Image
                    src={logoUrl.includes("white.png") ? "/logos/black.png" : logoUrl}
                    alt={brandName}
                    fill
                    className="object-contain"
                    sizes="128px"
                    priority
                  />
                </div>
              ) : (
                <span className="font-display-lg text-3xl font-light tracking-[0.25em] uppercase text-ink-black select-none hover:opacity-80 transition-opacity">
                  {brandName}
                </span>
              )}
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex justify-end items-center gap-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1 hover:text-deep-navy transition-colors duration-300 cursor-pointer flex items-center justify-center"
              aria-label="Search Catalog"
            >
              <i className="fa-solid fa-magnifying-glass text-[18px]"></i>
            </button>
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-1 hover:text-deep-navy transition-colors duration-300 cursor-pointer flex items-center justify-center relative"
              aria-label="View Wishlist"
            >
              <i className="fa-regular fa-heart text-[19px]"></i>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="p-1 hover:text-deep-navy transition-colors duration-300 cursor-pointer flex items-center justify-center"
              aria-label="User Account"
            >
              <i className="fa-regular fa-user text-[19px]"></i>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1 hover:text-deep-navy transition-colors duration-300 cursor-pointer flex items-center justify-center relative"
              aria-label="Open Shopping Bag"
            >
              <i className="fa-solid fa-bag-shopping text-[19px]"></i>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Links Navigation Row */}
        <div className="w-full border-t border-soft-linen py-3 bg-pure-white">
          <nav className="flex justify-center gap-8 items-center max-w-container-max mx-auto px-margin-desktop">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.path}
                className={`font-label-caps text-xs tracking-[0.15em] uppercase transition-colors py-1 border-b border-transparent hover:border-ink-black/40 ${
                  isActive(link.path) ? "text-ink-black border-ink-black font-semibold" : "text-ink-black/70 hover:text-ink-black"
                }`}
              >
                {(link.path === "/bespoke" || link.path.includes("bespoke")) && !bespokeEnabled ? `${link.label} (Waitlist)` : link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ─── MOBILE NAVIGATION ─── */}
      <header className="md:hidden sticky top-0 z-40 bg-pure-white text-ink-black border-b border-soft-linen px-margin-mobile py-4 flex justify-between items-center shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="cursor-pointer flex items-center justify-center w-8 h-8"
          aria-label="Open Menu Drawer"
        >
          <i className="fa-solid fa-bars text-[20px]"></i>
        </button>
        
        <Link href="/" className="flex items-center">
          {logoUrl && logoUrl !== "" ? (
            <div className="relative h-6 w-24">
              <Image
                src={logoUrl.includes("white.png") ? "/logos/black.png" : logoUrl}
                alt={brandName}
                fill
                className="object-contain"
                sizes="96px"
                priority
              />
            </div>
          ) : (
            <span className="font-display-lg text-xl tracking-[0.2em] uppercase text-ink-black select-none">
              {brandName}
            </span>
          )}
        </Link>
        
        <div className="flex gap-4 items-center">
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
              <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
        className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
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
                      <p className="text-[10px] text-slate-grey uppercase tracking-wider mt-0.5">{item.material}</p>
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
                      <p className="font-body-md text-sm font-semibold">${item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-soft-linen bg-surface/30 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-grey font-label-caps">Subtotal</span>
              <span className="font-semibold font-body-md">${subtotal}</span>
            </div>
            <p className="text-[10px] text-slate-grey leading-relaxed">
              Shipping & taxes calculated at checkout. Enjoy complimentary premium packaging on all orders.
            </p>
            <button
              onClick={() => {
                setIsCartOpen(false);
                router.push("/checkout");
              }}
              className="w-full py-4 bg-black text-white text-center uppercase tracking-widest text-xs font-button hover:bg-black/90 transition-colors shadow-md"
            >
              Secure Checkout
            </button>
          </div>
        )}
      </div>

      {/* ─── WISHLIST DRAWER (RIGHT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isWishlistOpen ? "translate-x-0" : "translate-x-full"
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
                      <p className="text-[10px] text-slate-grey uppercase tracking-wider mt-0.5">{item.material}</p>
                      <p className="font-body-md text-sm font-semibold mt-1">₹{item.price}</p>
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
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isSearchOpen ? "translate-x-0" : "translate-x-full"
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
          ) : searchResults.length === 0 ? (
            <p className="text-center text-slate-grey font-body-md text-sm py-12">No results found for "{searchQuery}".</p>
          ) : (
            <div className="space-y-4">
              <h4 className="font-label-caps text-[10px] text-slate-grey tracking-widest uppercase">Results ({searchResults.length})</h4>
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/collections/silent-center?product=${item.id}`}
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
                      <span className="text-[10px] text-slate-grey uppercase tracking-wider">{item.material} • {item.type}</span>
                      <span className="font-body-md text-xs font-semibold mt-1">${item.price}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MOBILE DRAWER (LEFT SLIDE-IN) ─── */}
      <div
        className={`fixed top-0 left-0 h-screen w-full sm:w-[350px] bg-pure-white text-ink-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-soft-linen flex justify-between items-center">
          <h3 className="font-label-caps text-sm tracking-widest font-semibold uppercase">Menu Navigation</h3>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-slate-grey hover:text-ink-black transition-colors"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 flex flex-col">
          <nav className="flex flex-col gap-5 font-label-caps text-base uppercase tracking-widest">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`pb-2 border-b border-soft-linen ${
                  isActive(link.path) ? "text-deep-navy font-semibold" : "text-ink-black/70 hover:text-ink-black"
                }`}
              >
                {(link.path === "/bespoke" || link.path.includes("bespoke")) && !bespokeEnabled ? `${link.label} (Waitlist)` : link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-soft-linen pt-6 flex justify-around">
            <Link
              href="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <i className="fa-regular fa-user text-[20px]"></i>
              <span className="text-[9px] uppercase font-label-caps mt-1 text-slate-grey">Account</span>
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsWishlistOpen(true);
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <i className="fa-regular fa-heart text-[20px]"></i>
              <span className="text-[9px] uppercase font-label-caps mt-1 text-slate-grey">Wishlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Drawer Modal */}
      <AuthDrawer isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
