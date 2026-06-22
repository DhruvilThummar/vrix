"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { fetchDb } from "@/utils/api";

const MEGAMENU_COLLECTIONS = [
  {
    id: "silent-center",
    title: "Silent Center",
    tagline: "For your balance",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ1SV0eXJGZrnjfsm6WOrr3dKft0IVZvS2oM6Wf_4vqwndBPocrNSLKtPsbIWUU4g7YWrwgFZmE16ipICZ0QKg6NulSK0D4DTI4FLnuehTPqcKDF-MPdTTbMRnYiwYRh3zsWojYE3R1iHTC60ZfQ8QWGmDD8mnP3JETge_mPnGQPnFepdY66OuKQsUgWIiwNWQZhfsJ00eO2IOXl7WoHUmQypxFUQFslrgHABiUUv1WrU2ZYbRgDbO_H6gk84g6nofQG2mXVqa538",
    link: "/collections/silent-center",
  },
  {
    id: "solitude",
    title: "Solitude",
    tagline: "For your inner world",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvjqmByDlRaJiifUTxVoINswXXm-PAkkbVJ9hcfeaPCrqjzkhDhne1pVofS21ApvXAeGd-OJFnGRzVL8xM1zqRCFmpkvOkIowL3V5vx4O5w-jEkPUpaAjd3iMY1jo-f1BXRbiYG4udPbS3MQHLhriu6sBx3BzN7lMwreEZ1yb4ZK1AR6DhvzuF6SFzUjcqZWiXVPPkEHA2TrBgX495Y9x6krS50C7hS02F_3H0td5UhiUYM92VuwUaofA_QbD6kd14XQ5N6xQdRN8",
    link: "/collections/silent-center?collection=solitude",
  },
  {
    id: "presence",
    title: "Presence",
    tagline: "For your everyday",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDphu-s5pByRrI5yOYV0iUrAQhJYlFn9pL56eus7YnulYdC3nxZphQV-dBchzOg9F9C9LvMP1pu7Z-pLdoAmvfuYBpwUk4oJ5auvdPVe_jU2tO6Ldyghkc_ftk25VpTLHGq_4DKkpFIC_w_TgCVCFNwT7xlIzlR6i-4QQwgJHFq41jST-K1fySNIMaWHIa6EMO_OoRUmmcTTgSqML2SGB8jMU92aBukkLElsZJVzQ6iVNHyjlgVNaAN0M56RCO3uUNhT8hu1AAtAqw",
    link: "/collections/silent-center?collection=presence",
  },
  {
    id: "light",
    title: "Light",
    tagline: "For your becoming",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2QH2OVjZuf5WcRIEP7F8npj47F7LSlY4eXFlP_4urMQx5FXf9gd87o02ZumQ7pm2WKo25BGUt1bsNce0d7I-HD7QC5boW3dnerz7a62sWZjsKrvbRlbS01UwRXiArH8ZtnywdNRZ25CDJfp2abQpz-434ejKZ6OU9sBKPqqq3g10R3Dft5zyZcRp64hHVhotbtoe1SR8QHkWs_cLCp2FAQd7pl75u-fLJSWWvSsfYYBJ2TJ0V4keUY4FKlbyDFJSKzK5hMm4-Huc",
    link: "/collections/silent-center?collection=light",
  },
];

const DEFAULT_LINKS = [
  { label: "Collections", path: "/collections" },
  { label: "The World of VRIX", path: "/story" },
  { label: "Journal", path: "/journal" },
  { label: "Gifts", path: "/search" },
  { label: "Bespoke", path: "/bespoke" },
  { label: "New Arrivals", path: "/collections/silent-center" }
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [collectionsHovered, setCollectionsHovered] = useState(false);

  const [navLinks, setNavLinks] = useState(DEFAULT_LINKS);
  const [logoUrl, setLogoUrl] = useState("/logos/white.png");

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.navigation) {
          setNavLinks(res.navigation);
        }
        if (res.brand && res.brand.logoUrl) {
          setLogoUrl(res.brand.logoUrl);
        }
      })
      .catch((err) => console.error("Error loading header navigation:", err));
  }, []);

  // Helper to check if current route is active
  const isActive = (path: string, exact = true) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Header */}
      <header
        className="sticky top-0 z-50 w-full bg-deep-navy text-pure-white border-b border-slate-grey/20 px-margin-desktop py-4 grid grid-cols-[1fr_auto_1fr] items-center lg:grid hidden"
        onMouseLeave={() => setCollectionsHovered(false)}
      >
        {/* Left: Nav links */}
        <div className="flex justify-start items-center">
          <nav className="flex gap-gutter items-center">
            {navLinks.map((link, idx) => {
              const isCollLink = link.path === "/collections";
              
              const linkContent = (
                <Link
                  href={link.path}
                  className={`font-label-caps text-xs tracking-widest uppercase transition-all duration-300 pb-1 border-b ${
                    isActive(link.path, isCollLink ? false : true)
                      ? "text-pure-white border-pure-white opacity-100"
                      : "text-pure-white/70 border-transparent hover:text-pure-white hover:border-pure-white/40"
                  }`}
                >
                  {link.label}
                </Link>
              );

              if (isCollLink) {
                return (
                  <div
                    key={idx}
                    className="py-1"
                    onMouseEnter={() => setCollectionsHovered(true)}
                  >
                    {linkContent}
                  </div>
                );
              }

              return (
                <div key={idx} className="py-1">
                  {linkContent}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-center items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={logoUrl}
              alt="VRIX Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-103"
              priority
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex justify-end items-center gap-stack-md">
          <Link
            href="/search"
            className="hover:text-pure-white transition-colors duration-300 cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <i className="fa-solid fa-magnifying-glass text-[16px]"></i>
          </Link>
          <Link
            href="/account"
            className="hover:text-pure-white transition-colors duration-300 cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <i className="fa-regular fa-user text-[18px]"></i>
          </Link>
          <Link
            href="/wishlist"
            className="hover:text-pure-white transition-colors duration-300 cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <i className="fa-regular fa-heart text-[18px]"></i>
          </Link>
          <Link
            href="/cart"
            className="hover:text-pure-white transition-colors duration-300 cursor-pointer relative flex items-center justify-center w-8 h-8"
          >
            <i className="fa-solid fa-cart-shopping text-[18px]"></i>
            <span className="absolute -top-1.5 -right-2 bg-pure-white text-deep-navy font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-deep-navy/20 shadow-sm">
              2
            </span>
          </Link>
        </div>

        {/* Collections Hover Megamenu */}
        {collectionsHovered && (
          <div
            className="absolute top-full left-0 w-full bg-deep-navy border-t border-slate-grey/20 py-8 shadow-xl text-pure-white z-40 transition-all duration-300 ease-out animate-fade-in"
            onMouseEnter={() => setCollectionsHovered(true)}
            onMouseLeave={() => setCollectionsHovered(false)}
          >
            <div className="max-w-container-max mx-auto px-margin-desktop">
              {/* Megamenu Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-grey/20">
                <span className="font-label-caps text-[10px] tracking-widest text-pure-white/50 uppercase">
                  VRIX Collections
                </span>
                <Link
                  href="/collections"
                  className="font-label-caps text-xs tracking-widest text-pure-white hover:text-pure-white/70 transition-colors uppercase flex items-center gap-2"
                >
                  Explore All Collections
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>

              {/* Megamenu Cards */}
              <div className="grid grid-cols-4 gap-gutter">
                {MEGAMENU_COLLECTIONS.map((col) => (
                  <Link
                    key={col.id}
                    href={col.link}
                    className="group/item flex flex-col gap-3"
                  >
                    <div className="aspect-[16/10] relative w-full overflow-hidden bg-soft-linen/10 border border-slate-grey/10">
                      <Image
                        src={col.image}
                        alt={col.title}
                        fill
                        className="object-cover group-hover/item:scale-103 transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-label-caps text-xs tracking-wider uppercase font-semibold text-pure-white group-hover/item:text-pure-white/80 transition-colors">
                        {col.title}
                      </h4>
                      <p className="text-[10px] text-pure-white/60 tracking-wider uppercase">
                        {col.tagline}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full bg-deep-navy text-pure-white px-margin-mobile py-4 flex justify-between items-center lg:hidden border-b border-slate-grey/20">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="cursor-pointer flex items-center justify-center w-8 h-8"
        >
          {mobileMenuOpen ? (
            <i className="fa-solid fa-xmark text-[18px]"></i>
          ) : (
            <i className="fa-solid fa-bars text-[18px]"></i>
          )}
        </button>
        <Link href="/" className="flex items-center">
          <Image
            src={logoUrl}
            alt="VRIX Logo"
            width={100}
            height={32}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex gap-stack-sm items-center">
          <Link
            href="/search"
            className="cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <i className="fa-solid fa-magnifying-glass text-[16px]"></i>
          </Link>
          <Link
            href="/cart"
            className="cursor-pointer flex items-center justify-center w-8 h-8 relative"
          >
            <i className="fa-solid fa-cart-shopping text-[16px]"></i>
            <span className="absolute -top-1 -right-1 bg-pure-white text-deep-navy font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-deep-navy/20 shadow-sm">
              2
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[57px] bottom-0 z-40 bg-deep-navy text-pure-white flex flex-col px-margin-mobile py-8 lg:hidden overflow-y-auto transition-transform duration-300">
          <nav className="flex flex-col gap-6 font-label-caps text-lg uppercase tracking-wider">
            {navLinks.map((link, idx) => {
              const isCollLink = link.path === "/collections";
              if (isCollLink) {
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen)}
                      className="w-full flex justify-between items-center pb-2 border-b border-pure-white/10 text-left font-label-caps text-lg uppercase tracking-wider text-pure-white/80 hover:text-pure-white"
                    >
                      <span>{link.label}</span>
                      <i
                        className={`fa-solid fa-chevron-down text-sm transition-transform duration-300 ${
                          mobileCollectionsOpen ? "rotate-180" : ""
                        }`}
                      ></i>
                    </button>
                    {mobileCollectionsOpen && (
                      <div className="flex flex-col gap-3 pl-4 pt-3 text-sm font-label-caps text-pure-white/70">
                        <Link
                          href="/collections/silent-center"
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-pure-white transition-colors py-1 border-b border-pure-white/5"
                        >
                          Silent Center
                        </Link>
                        <Link
                          href="/collections/silent-center?collection=solitude"
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-pure-white transition-colors py-1 border-b border-pure-white/5"
                        >
                          Solitude
                        </Link>
                        <Link
                          href="/collections/silent-center?collection=presence"
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-pure-white transition-colors py-1 border-b border-pure-white/5"
                        >
                          Presence
                        </Link>
                        <Link
                          href="/collections/silent-center?collection=light"
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-pure-white transition-colors py-1 border-b border-pure-white/5"
                        >
                          Light
                        </Link>
                        <Link
                          href="/collections"
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-pure-white font-semibold transition-colors py-1 text-pure-white"
                        >
                          Explore All Collections
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={idx}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="pb-2 border-b border-pure-white/10"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex justify-around border-t border-pure-white/10 pt-6">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <i className="fa-regular fa-user text-[18px]"></i>
              <span className="text-[10px] uppercase font-label-caps mt-1">
                Account
              </span>
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <i className="fa-regular fa-heart text-[18px]"></i>
              <span className="text-[10px] uppercase font-label-caps mt-1">
                Wishlist
              </span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
