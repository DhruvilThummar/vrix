"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDb } from "@/utils/api";
import CurrencySelector from "@/components/CurrencySelector";

export default function Footer() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedCurrency, setSelectedCurrency] = useState("Europe (EUR)");
  const [brandName, setBrandName] = useState("VRIX");
  const [logoUrl, setLogoUrl] = useState("/logos/white.png");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.brand) {
          if (res.brand.name) setBrandName(res.brand.name);
          if (res.brand.logoUrl) setLogoUrl(res.brand.logoUrl);
          if (res.brand.address) setAddress(res.brand.address);
          if (res.brand.phone) setPhone(res.brand.phone);
          if (res.brand.email) setEmail(res.brand.email);
        }
      })
      .catch((err) => console.error("Error loading footer brand info:", err));
  }, []);

  return (
    <footer className="bg-[#F5F4F0] text-ink-black/80 border-t border-slate-grey/20 pt-16 pb-8 font-body-md text-sm">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-gutter pb-12">
        
        {/* Column 1: Brand details */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex flex-col select-none">
            {logoUrl && logoUrl !== "" ? (
              <div className="relative h-8 w-32 my-1">
                <Image
                  src={logoUrl}
                  alt={brandName}
                  fill
                  className="object-contain object-left"
                  sizes="128px"
                  priority
                />
              </div>
            ) : (
              <span className="font-display-lg text-3xl font-light tracking-[0.25em] uppercase text-ink-black">
                {brandName}
              </span>
            )}
            <span className="text-[9px] font-label-caps tracking-[0.3em] uppercase text-[#B59D7C] font-semibold mt-1">
              Feel The Luxury
            </span>
          </Link>
          
          <div className="my-1 text-[#B59D7C]">
            {/* Elegant 4-point star character */}
            <span className="text-2xl font-light">✦</span>
          </div>

          <div className="font-body-md text-xs leading-relaxed text-slate-grey/90 space-y-2 max-w-[240px]">
            {address && <p>{address}</p>}
            {phone && <p>T: {phone}</p>}
            {email && <p>E: <a href={`mailto:${email}`} className="hover:underline">{email}</a></p>}
            {!address && !phone && !email && (
              <p>Designed for the moments that belong only to you.</p>
            )}
          </div>
        </div>

        {/* Column 2: HELP */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
            Help
          </h4>
          <Link href="/legal?tab=faq" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            FAQ
          </Link>
          <Link href="/legal?tab=shipping" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Shipping
          </Link>
          <Link href="/legal?tab=returns" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Returns & Exchanges
          </Link>
          <Link href="/legal?tab=care" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Warranty
          </Link>
          <Link href="/account" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Track Order
          </Link>
          <Link href="/contact" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Contact Us
          </Link>
        </div>

        {/* Column 3: ABOUT VRIX */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
            About VRIX
          </h4>
          <Link href="/story" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Our Story
          </Link>
          <Link href="/story" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Craftsmanship
          </Link>
          <Link href="/story" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Materials
          </Link>
          <Link href="/story" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Sustainability
          </Link>
          <Link href="/story" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Careers
          </Link>
        </div>

        {/* Column 4: JOURNAL */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
            Journal
          </h4>
          <Link href="/journal" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Stories
          </Link>
          <Link href="/legal?tab=care" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Jewelry Care
          </Link>
          <Link href="/search?filter=gifts" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Gift Guide
          </Link>
          <Link href="/journal" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Style Guide
          </Link>
          <Link href="/journal" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
            Behind The Design
          </Link>
        </div>

        {/* Column 5: FOLLOW */}
        <div className="flex flex-col gap-3">
          <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
            Follow
          </h4>
          <a href="#" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
            <i className="fa-brands fa-instagram text-sm w-4 text-center"></i>
            Instagram
          </a>
          <a href="#" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
            <i className="fa-brands fa-pinterest text-sm w-4 text-center"></i>
            Pinterest
          </a>
          <a href="#" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
            <i className="fa-brands fa-linkedin-in text-sm w-4 text-center"></i>
            LinkedIn
          </a>
          <a href="#" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
            <i className="fa-brands fa-youtube text-sm w-4 text-center"></i>
            YouTube
          </a>
        </div>

      </div>

      {/* Selector & Payment Row */}
      <div className="border-t border-b border-slate-grey/25 py-6 bg-[#EBEAE4]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Currency Selector */}
          <div className="flex items-center gap-2 font-label-caps text-xs">
            <span className="text-slate-grey">Region & Currency:</span>
            <CurrencySelector />
          </div>

          {/* Payment Icons */}
          <div className="flex flex-wrap gap-4 items-center text-xl text-ink-black/60">
            <i className="fa-brands fa-cc-visa hover:text-[#1A1F71] transition-colors" title="Visa"></i>
            <i className="fa-brands fa-cc-mastercard hover:text-[#EB001B] transition-colors" title="Mastercard"></i>
            <i className="fa-brands fa-cc-amex hover:text-[#007CC3] transition-colors" title="Amex"></i>
            <i className="fa-brands fa-cc-apple-pay hover:text-black transition-colors" title="Apple Pay"></i>
            <i className="fa-brands fa-google-pay hover:text-[#4285F4] transition-colors text-2xl" title="Google Pay"></i>
            <i className="fa-brands fa-cc-stripe hover:text-[#6772E5] transition-colors" title="Stripe"></i>
            <i className="fa-brands fa-cc-paypal hover:text-[#003087] transition-colors" title="PayPal"></i>
          </div>
        </div>
      </div>

      {/* Legal Links Bar */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full flex flex-col md:flex-row justify-between items-center pt-6 gap-4 font-label-caps text-[10px] text-slate-grey">
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/legal?tab=privacy" className="hover:text-ink-black transition-colors">
            Privacy Policy
          </Link>
          <span className="opacity-45">|</span>
          <Link href="/legal?tab=terms" className="hover:text-ink-black transition-colors">
            Terms & Conditions
          </Link>
          <span className="opacity-45">|</span>
          <Link href="/legal?tab=privacy" className="hover:text-ink-black transition-colors">
            Cookie Policy
          </Link>
          <span className="opacity-45">|</span>
          <button
            onClick={() => window.dispatchEvent(new Event("vrix-open-cookie-modal"))}
            className="hover:text-ink-black transition-colors cursor-pointer"
          >
            Cookie Preferences
          </button>
          <span className="opacity-45">|</span>
          <Link href="/legal?tab=faq" className="hover:text-ink-black transition-colors">
            Accessibility
          </Link>
        </div>
        <p className="tracking-widest uppercase">
          © 2026 {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
