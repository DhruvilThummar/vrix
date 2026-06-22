"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-pure-white text-on-surface antialiased flex flex-col items-center justify-center">
      {/* Decorative ambient background elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-soft-linen rounded-full blur-[120px] opacity-50 mix-blend-multiply"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary-fixed-dim rounded-full blur-[150px] opacity-30 mix-blend-multiply"></div>
      </div>

      {/* Top Navigation (Simplified for utility page) */}
      <header className="absolute top-0 left-0 w-full px-margin-mobile md:px-margin-desktop py-6 flex justify-between items-center z-50">
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/blue.png"
            alt="VRIX Logo"
            width={120}
            height={40}
            className="h-6 md:h-8 w-auto object-contain cursor-pointer"
            priority
          />
        </Link>
        <div className="flex items-center gap-4 md:gap-6 relative">
          <Link
            href="/search"
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center text-deep-navy border border-slate-grey/30 rounded-full hover:bg-soft-linen transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-magnifying-glass text-[16px]"></i>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
            className="w-10 h-10 flex items-center justify-center text-deep-navy border border-slate-grey/30 rounded-full hover:bg-soft-linen transition-colors cursor-pointer z-50 relative"
          >
            {menuOpen ? (
              <i className="fa-solid fa-xmark text-[16px]"></i>
            ) : (
              <i className="fa-solid fa-bars text-[16px]"></i>
            )}
          </button>

          {/* Minimalist Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-pure-white border border-slate-grey/25 shadow-2xl p-6 flex flex-col gap-4 z-50 rounded-none text-left">
              <h3 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest border-b border-slate-grey/15 pb-2 mb-1">
                Navigation
              </h3>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/collections/silent-center"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Collections
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/bespoke"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Bespoke
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/modular-builder"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Modular Builder
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/wholesale"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Wholesale Portal
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/journal"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Journal
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                href="/contact"
                className="font-label-caps text-label-caps text-deep-navy hover:text-slate-grey transition-colors uppercase"
              >
                Contact
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 text-center px-margin-mobile max-w-3xl mx-auto flex flex-col items-center justify-center w-full min-h-[614px]">
        {/* Large 404 text */}
        <h1 className="font-display-lg text-[120px] md:text-[180px] leading-none text-slate-grey font-bold tracking-tighter mb-stack-lg select-none opacity-90">
          404
        </h1>
        {/* Subtle divider */}
        <div className="w-16 h-px bg-slate-grey/40 mb-stack-lg mx-auto"></div>
        {/* Message */}
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-12">
          We couldn&apos;t find the page you&apos;re looking for, but there is always something beautiful to discover.
        </p>
        {/* CTA Button */}
        <Link className="inline-flex items-center justify-center px-10 py-4 bg-deep-navy text-pure-white font-button text-button uppercase tracking-widest border border-deep-navy hover:bg-transparent hover:text-deep-navy transition-all duration-300 group cursor-pointer" href="/">
          Return to Home
          <i className="fa-solid fa-arrow-right ml-2 text-[14px] group-hover:translate-x-1 transition-transform"></i>
        </Link>
        {/* Additional Links */}
        <div className="mt-section-gap flex gap-8 justify-center opacity-80">
          <Link className="font-label-caps text-label-caps text-secondary uppercase hover:text-deep-navy transition-colors pb-1 border-b border-transparent hover:border-deep-navy" href="/collections/silent-center">
            Collections
          </Link>
          <Link className="font-label-caps text-label-caps text-secondary uppercase hover:text-deep-navy transition-colors pb-1 border-b border-transparent hover:border-deep-navy" href="/journal">
            Journal
          </Link>
          <Link className="font-label-caps text-label-caps text-secondary uppercase hover:text-deep-navy transition-colors pb-1 border-b border-transparent hover:border-deep-navy" href="/contact">
            Contact
          </Link>
        </div>
      </main>

      {/* Footer (Simplified for utility page) */}
      <footer className="absolute bottom-0 w-full px-margin-mobile md:px-margin-desktop py-8 border-t border-slate-grey/10 flex flex-col md:flex-row justify-between items-center z-20 text-slate-grey bg-pure-white/80 backdrop-blur-sm">
        <span className="font-body-md text-[12px] mb-4 md:mb-0">© 2026 VRIX. All rights reserved.</span>
        <div className="flex gap-6">
          <a className="font-body-md text-[12px] hover:text-deep-navy transition-colors" href="#">
            Privacy
          </a>
          <a className="font-body-md text-[12px] hover:text-deep-navy transition-colors" href="#">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
