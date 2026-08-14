"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Careers at VRIX",
  content: "Join the team redefining modern minimalist luxury fine jewelry. We are always looking for passionate artisans, e-commerce visionaries, brand storytellers, and customer experience specialists. Send your portfolio to vrixjewels@gmail.com to start your journey with us."
};

const OPEN_POSITIONS = [
  {
    role: "Senior Jewelry Designer",
    department: "Atelier Studio • Surat",
    type: "Full-Time",
    desc: "Lead architectural 3D CAD modeling and lost-wax prototyping for solitaire diamond collections."
  },
  {
    role: "E-Commerce Growth Specialist",
    department: "Digital Experience • Remote / Surat",
    type: "Full-Time",
    desc: "Drive conversion optimization, client acquisition, and luxury digital storefront performance."
  },
  {
    role: "Private Concierge Advisor",
    department: "Client Care • Remote",
    type: "Full-Time",
    desc: "Deliver personalized 1-on-1 consultations and bespoke commissioning support for private clientele."
  }
];

export default function CareersPage() {
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.careers) {
          setData((prev) => ({ ...prev, ...res.careers }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white text-ink-black selection:bg-deep-navy selection:text-white">
      {/* ─── Hero Banner ─── */}
      <section className="bg-deep-navy text-pure-white py-24 md:py-32 px-margin-mobile md:px-margin-desktop text-center border-b border-slate-grey/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="font-jost font-secondary text-label-caps text-xs tracking-[0.25em] text-[#B59D7C] uppercase block">
            JOIN OUR TEAM • VRIX ATELIER
          </span>
          <h1 className="font-inter font-primary text-3xl md:text-5xl font-light uppercase tracking-wider text-pure-white">
            {data.heroTitle}
          </h1>
          <div className="w-16 h-[2px] bg-[#B59D7C] mx-auto mt-6 mb-8" />
          <p className="font-jost font-secondary text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            {data.content}
          </p>
        </div>
      </section>

      {/* ─── Open Roles Section ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16 space-y-3">
          <span className="font-jost font-secondary text-label-caps text-xs text-[#B59D7C] tracking-widest uppercase">
            OPEN POSITIONS
          </span>
          <h2 className="font-inter font-primary text-2xl md:text-4xl text-deep-navy uppercase tracking-wider">
            Shape The Future Of Fine Jewelry
          </h2>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {OPEN_POSITIONS.map((pos, idx) => (
            <div key={idx} className="bg-soft-linen p-8 border border-slate-grey/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-inter font-primary text-lg font-semibold text-deep-navy uppercase">
                    {pos.role}
                  </h3>
                  <span className="font-inter font-primary text-[10px] tracking-widest text-deep-navy bg-white px-2 py-0.5 border border-slate-grey/20 uppercase">
                    {pos.type}
                  </span>
                </div>
                <p className="font-jost font-secondary text-xs text-[#B59D7C] uppercase tracking-wider">
                  {pos.department}
                </p>
                <p className="font-jost font-secondary text-sm text-slate-grey">
                  {pos.desc}
                </p>
              </div>

              <a
                href="mailto:vrixjewels@gmail.com?subject=Application%20for%20Career%20Role"
                className="shrink-0 inline-block bg-deep-navy text-pure-white px-6 py-3 font-inter font-primary text-xs uppercase tracking-widest hover:bg-black transition-colors text-center"
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
