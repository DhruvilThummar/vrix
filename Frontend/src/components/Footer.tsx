"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { fetchDb } from "@/utils/api";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState("/logos/white.png");
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.brand && res.brand.logoUrl) {
          setLogoUrl(res.brand.logoUrl);
        }
        if (res.collections) {
          setCollections(res.collections);
        }
      })
      .catch((err) => console.error("Error loading footer logo:", err));
  }, []);

  return (
    <footer className="bg-deep-navy text-pure-white border-t border-slate-grey/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-section-gap w-full max-w-container-max mx-auto">
        {/* Brand Column */}
        <div className="flex flex-col gap-6 md:col-span-1">
          <Link href="/" className="flex items-center">
            <Image
              src={logoUrl}
              alt="VRIX Logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain cursor-pointer"
            />
          </Link>
          <p className="font-body-md text-pure-white/70 text-sm max-w-xs leading-relaxed">
            Become part of the VRIX world.<br />
            Early access. Meaningful stories. Exclusive rewards.
          </p>
          <div className="flex gap-2 max-w-xs mt-2">
            <input
              className="bg-transparent border-b border-pure-white/30 px-0 py-2 text-pure-white placeholder-pure-white/50 focus:outline-none focus:border-pure-white focus:ring-0 w-full font-body-md"
              placeholder="Enter your email"
              type="email"
            />
            <button className="font-button text-button uppercase px-4 py-2 bg-pure-white text-deep-navy hover:bg-pure-white/90 transition-colors cursor-pointer">
              Join Us
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-4 mt-8 md:mt-0 font-body-md text-sm">
          <h4 className="font-label-caps text-pure-white/50 mb-2">Collections</h4>
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/silent-center?collection=${col.id}`}
              className="text-pure-white/70 hover:text-pure-white transition-colors duration-300"
            >
              {col.title}
            </Link>
          ))}
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/collections">
            All Collections
          </Link>
        </div>

        <div className="flex flex-col gap-4 mt-8 md:mt-0 font-body-md text-sm">
          <h4 className="font-label-caps text-pure-white/50 mb-2">The World of VRIX</h4>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/story">
            Our Story
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/story">
            Craftsmanship
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/story">
            Sustainability
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/journal">
            Journal
          </Link>
        </div>

        <div className="flex flex-col gap-4 mt-8 md:mt-0 font-body-md text-sm">
          <h4 className="font-label-caps text-pure-white/50 mb-2">Customer Care</h4>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/legal?tab=faq">
            FAQ
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/legal?tab=shipping">
            Shipping & Delivery
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/legal?tab=returns">
            Returns
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/legal?tab=care">
            Care Guide
          </Link>
          <Link className="text-pure-white/70 hover:text-pure-white transition-colors duration-300" href="/contact">
            Contact Us
          </Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-grey/20">
        <div className="px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-label-caps text-[10px] text-pure-white/50 uppercase tracking-widest">
            © 2026 VRIX. All rights reserved.
          </p>
          {/* Social Links using custom images */}
          <div className="flex gap-4 items-center">
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity duration-300">
              <Image
                src="/logos/instagram.jpg"
                alt="Instagram"
                width={20}
                height={20}
                className="h-5 w-5 object-contain rounded-full"
              />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity duration-300">
              <Image
                src="/logos/Facebook.jpg"
                alt="Facebook"
                width={20}
                height={20}
                className="h-5 w-5 object-contain rounded-full"
              />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity duration-300">
              <Image
                src="/logos/Linkedin.jpg"
                alt="LinkedIn"
                width={20}
                height={20}
                className="h-5 w-5 object-contain rounded-full"
              />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity duration-300">
              <Image
                src="/logos/whatsapp.jpg"
                alt="WhatsApp"
                width={20}
                height={20}
                className="h-5 w-5 object-contain rounded-full"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
