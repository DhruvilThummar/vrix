"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDb, getApiBaseUrl } from "@/utils/api";
import CurrencySelector from "@/components/CurrencySelector";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { user, isLoggedIn } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedCurrency, setSelectedCurrency] = useState("Europe (EUR)");
  const [brandName, setBrandName] = useState("VRIX");
  const [logoUrl, setLogoUrl] = useState("/logos/black.png");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [footerLinks, setFooterLinks] = useState<any[]>([]);

  const [vrixPlusHeadline, setVrixPlusHeadline] = useState("Join VRIX+ Circle for early sale access, birthday treats, a discount on your first order, and more.");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [brandPaymentIcons, setBrandPaymentIcons] = useState<string[]>(["visa", "mastercard", "amex", "apple-pay", "google-pay", "stripe", "paypal"]);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.brand) {
          if (res.brand.name) setBrandName(res.brand.name);
          if (res.brand.logoUrl) setLogoUrl(res.brand.logoUrl);
          if (res.brand.address) setAddress(res.brand.address);
          if (res.brand.phone) setPhone(res.brand.phone);
          if (res.brand.email) setEmail(res.brand.email);
          if (Array.isArray(res.brand.paymentIcons)) {
            setBrandPaymentIcons(res.brand.paymentIcons);
          }
        }
        if (res.vrix_plus && res.vrix_plus.headline) {
          setVrixPlusHeadline(res.vrix_plus.headline);
        }
        if (Array.isArray(res.footerLinks)) {
          setFooterLinks(res.footerLinks);
        }
      })
      .catch((err) => console.error("Error loading footer brand info:", err));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      await fetch(`${apiBaseUrl}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() })
      });
      setNewsletterSuccess(true);
      setNewsletterEmail("");
    } catch (err) {
      console.error(err);
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="bg-[#F5F4F0] text-ink-black/80 border-t border-slate-grey/20 pt-12 pb-8 font-body-md text-sm">

      {/* ─── MONICA VINADER STYLE VRIX+ CIRCLE NEWSLETTER BANNER ─── */}
      <div className="border-b border-slate-grey/20 pb-12 mb-12 bg-[#FAF8F5] py-10 px-margin-mobile md:px-margin-desktop">
        {isLoggedIn && user?.isVrixPlusMember ? (
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <span className="font-label-caps text-[10px] tracking-[0.3em] uppercase text-[#B59D7C] font-semibold">
              ★ VRIX+ CIRCLE MEMBER
            </span>
            <h3 className="font-display-lg text-xl md:text-2xl text-deep-navy font-light uppercase tracking-wider">
              Welcome back, {user.name || "Valued Member"}. Your VRIX+ Circle perks & extra discounts are active.
            </h3>
            <p className="text-xs text-slate-grey font-body-md">
              Enjoy exclusive priority concierge, early access to releases, and complimentary signature gift wrapping.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="font-label-caps text-[10px] tracking-[0.3em] uppercase text-[#B59D7C] font-semibold">
              VRIX+ CIRCLE
            </span>
            <h3 className="font-display-lg text-2xl md:text-3xl text-deep-navy font-light uppercase tracking-wider max-w-2xl mx-auto leading-snug">
              {vrixPlusHeadline}
            </h3>

            {newsletterSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-body-md max-w-md mx-auto animate-fade-in">
                ★ Welcome to VRIX+ Circle! Your first order discount is ready. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="flex-1 bg-pure-white border border-slate-grey/30 px-4 py-3 text-sm font-body-md text-ink-black focus:border-black outline-none"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-8 py-3 bg-black text-white font-button text-xs uppercase tracking-widest hover:bg-black/90 transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {newsletterLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Join Now</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-[11px] text-slate-grey font-body-md max-w-lg mx-auto">
              We'll update you by email + SMS and you can unsubscribe at any time —{" "}
              <Link href="/legal?tab=privacy" className="underline hover:text-black">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-gutter pb-12">

        {/* Column 1: Brand details */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex flex-col select-none">
            {logoUrl && logoUrl !== "" ? (
              <div className="relative my-1">
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-8 max-w-[160px] object-contain object-left"
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

        {footerLinks && footerLinks.length > 0 ? (
          <>
            {footerLinks.map((column, idx) => (
              <div key={column.id || idx} className="flex flex-col gap-3">
                <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
                  {column.title}
                </h4>
                {column.links && column.links.map((link: any, linkIdx: number) => {
                  const isExternal = link.path.startsWith("http://") || link.path.startsWith("https://");
                  const hasIcon = !!link.icon;
                  if (isExternal) {
                    return (
                      <a
                        key={linkIdx}
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90 flex items-center gap-2"
                      >
                        {hasIcon && <i className={`${link.icon} text-sm w-4 text-center`}></i>}
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={linkIdx}
                      href={link.path}
                      className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90 flex items-center gap-2"
                    >
                      {hasIcon && <i className={`${link.icon} text-sm w-4 text-center`}></i>}
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </>
        ) : (
          <>
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
              <Link href="/craftsmanship" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
                Craftsmanship
              </Link>
              <Link href="/materials" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
                Materials
              </Link>
              <Link href="/sustainability" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
                Sustainability
              </Link>
              <Link href="/careers" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
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
              <Link href="/style-guide" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
                Style Guide
              </Link>
              <Link href="/behind-the-design" className="text-xs hover:text-ink-black transition-colors duration-200 text-slate-grey/90">
                Behind The Design
              </Link>
            </div>

            {/* Column 5: FOLLOW */}
            <div className="flex flex-col gap-3">
              <h4 className="font-label-caps text-xs tracking-wider uppercase text-ink-black font-bold mb-1">
                Follow
              </h4>
              <a href="https://www.instagram.com/vrix.official" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
                <i className="fa-brands fa-instagram text-sm w-4 text-center"></i>
                Instagram
              </a>
              <a href="https://www.linkedin.com/company/vrixjewels/" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
                <i className="fa-brands fa-linkedin-in text-sm w-4 text-center"></i>
                LinkedIn
              </a>
              <a href="https://share.google/EjrRFPTc3O06labrR" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-ink-black transition-colors duration-200 flex items-center gap-2 text-slate-grey/90">
                <i className="fa-brands fa-location-dot text-sm w-4 text-center"></i>
                Location
              </a>
            </div>
          </>
        )}

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
            {brandPaymentIcons.includes("visa") && <i className="fa-brands fa-cc-visa hover:text-[#1A1F71] transition-colors" title="Visa"></i>}
            {brandPaymentIcons.includes("mastercard") && <i className="fa-brands fa-cc-mastercard hover:text-[#EB001B] transition-colors" title="Mastercard"></i>}
            {brandPaymentIcons.includes("amex") && <i className="fa-brands fa-cc-amex hover:text-[#007CC3] transition-colors" title="Amex"></i>}
            {brandPaymentIcons.includes("apple-pay") && <i className="fa-brands fa-cc-apple-pay hover:text-black transition-colors" title="Apple Pay"></i>}
            {brandPaymentIcons.includes("google-pay") && <i className="fa-brands fa-google-pay hover:text-[#4285F4] transition-colors text-2xl" title="Google Pay"></i>}
            {brandPaymentIcons.includes("stripe") && <i className="fa-brands fa-cc-stripe hover:text-[#6772E5] transition-colors" title="Stripe"></i>}
            {brandPaymentIcons.includes("paypal") && <i className="fa-brands fa-cc-paypal hover:text-[#003087] transition-colors" title="PayPal"></i>}
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
            onClick={() => window.dispatchEvent(new Event("openCookiePreferences"))}
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
