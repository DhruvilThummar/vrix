"use client";

import React, { useState, useEffect } from "react";
import { fetchDbPublic as fetchDb } from "@/utils/api";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  readTime: string;
}

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Architectural Minimalism: The Philosophy Behind VRIX",
    excerpt: "Exploring how architectural forms and clean geometric silhouettes inspire our fine jewelry collections.",
    content: "Jewelry shouldn't overpower; it should harmonize. At VRIX, we take inspiration from modern brutalist architecture and clean minimalist lines. Every setting is engineered to remove excess metal while enhancing light reflection across lab-grown diamond facets.\n\nOur philosophy rests on three pillars: structural balance, tactile weight, and quiet luxury that feels like an organic extension of the wearer.",
    image: "",
    date: "OCTOBER 2024",
    readTime: "4 MIN READ"
  },
  {
    id: "art-2",
    title: "The Lab-Grown Diamond Revolution: Conscious Brilliance",
    excerpt: "Why lab-grown diamonds represent the future of sustainable fine jewelry without optical or chemical compromise.",
    content: "Lab-grown diamonds are physically, chemically, and optically identical to mined diamonds. Created using advanced chemical vapor deposition (CVD) powered by renewable energy, VRIX lab-grown diamonds allow us to offer zero-conflict, high-purity solitaires at accessible price points.\n\nBy avoiding traditional mining, we eliminate human impact and environmental destruction while delivering VS+ clarity and F-G color brilliance.",
    image: "",
    date: "NOVEMBER 2024",
    readTime: "5 MIN READ"
  },
  {
    id: "art-3",
    title: "The Ultimate Guide to Caring for 18K Gold Vermeil",
    excerpt: "Essential care instructions to maintain the luster and thick golden finish of your VRIX jewelry for years.",
    content: "18K Gold Vermeil is a thick layer of solid 18K gold electroplated over pure 925 Sterling Silver. To preserve its luster:\n\n1. Store in your complimentary VRIX velvet pouch away from humidity.\n2. Avoid direct application of perfumes, lotions, or sanitizers.\n3. Clean softly using an un-treated microfiber cloth.",
    image: "",
    date: "DECEMBER 2024",
    readTime: "3 MIN READ"
  }
];

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res && Array.isArray(res.journal) && res.journal.length > 0) {
          setArticles(res.journal);
        } else {
          setArticles(DEFAULT_ARTICLES);
        }
        setLoading(false);
      })
      .catch((err) => {
        setArticles(DEFAULT_ARTICLES);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white text-ink-black selection:bg-deep-navy selection:text-white">
      {/* ─── Hero Banner ─── */}
      <section className="bg-deep-navy text-pure-white py-24 md:py-32 px-margin-mobile md:px-margin-desktop text-center border-b border-slate-grey/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="font-jost font-secondary text-label-caps text-xs tracking-[0.25em] text-[#B59D7C] uppercase block">
            EDITORIAL JOURNAL • VOLUME 01
          </span>
          <h1 className="font-inter font-primary text-3xl md:text-5xl font-light uppercase tracking-wider text-pure-white">
            The VRIX Journal
          </h1>
          <div className="w-16 h-[2px] bg-[#B59D7C] mx-auto mt-6 mb-8" />
          <p className="font-jost font-secondary text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            Insights on architectural jewelry design, lab-grown diamond innovation, and modern conscious luxury.
          </p>
        </div>
      </section>

      {/* ─── Articles Grid ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="group cursor-pointer bg-soft-linen p-8 border border-slate-grey/15 flex flex-col justify-between space-y-6 hover:border-deep-navy transition-colors duration-300"
            >
              <div className="space-y-4">
                <div className="flex gap-3 items-center text-[10px] font-inter font-primary text-[#B59D7C] tracking-widest uppercase">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="font-inter font-primary text-lg font-semibold text-deep-navy group-hover:text-black transition-colors uppercase leading-snug">
                  {article.title}
                </h2>
                <p className="font-jost font-secondary text-xs md:text-sm text-slate-grey leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <span className="inline-flex items-center gap-2 font-inter font-primary text-xs text-deep-navy font-semibold uppercase tracking-widest pt-4">
                Read Article <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* Immersive Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-ink-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-pure-white max-w-3xl w-full max-h-[90vh] overflow-y-auto relative border border-slate-grey/25 shadow-2xl">
            {/* Sticky Modal Close Bar */}
            <div className="sticky top-0 right-0 w-full flex justify-end p-4 bg-pure-white/90 backdrop-blur-md border-b border-slate-grey/10 z-10">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-grey hover:text-ink-black cursor-pointer flex items-center gap-1 font-label-caps text-xs tracking-wider"
              >
                CLOSE <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Content Container */}
            <div className="p-8 md:p-12 space-y-8">
              <div className="space-y-4">
                <div className="flex gap-4 items-center text-xs font-label-caps text-slate-grey tracking-wider uppercase">
                  <span>{selectedArticle.date}</span>
                  <span className="w-1.5 h-1.5 bg-slate-grey/30 rounded-full"></span>
                  <span>{selectedArticle.readTime}</span>
                </div>
                <h2 className="font-display-lg text-headline-lg text-deep-navy">
                  {selectedArticle.title}
                </h2>
                <p className="italic font-body-lg text-slate-grey text-base border-l-2 border-slate-grey/30 pl-4">
                  {selectedArticle.excerpt}
                </p>
              </div>

              {/* Gold Divider Line */}
              <div className="w-16 h-[2px] bg-[#B59D7C]" />

              {/* Article Main Copy */}
              <div className="font-body-md text-sm text-slate-grey leading-relaxed whitespace-pre-line space-y-4">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
