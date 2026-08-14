"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop",
    date: "OCTOBER 2024",
    readTime: "4 MIN READ"
  },
  {
    id: "art-2",
    title: "The Lab-Grown Diamond Revolution: Conscious Brilliance",
    excerpt: "Why lab-grown diamonds represent the future of sustainable fine jewelry without optical or chemical compromise.",
    content: "Lab-grown diamonds are physically, chemically, and optically identical to mined diamonds. Created using advanced chemical vapor deposition (CVD) powered by renewable energy, VRIX lab-grown diamonds allow us to offer zero-conflict, high-purity solitaires at accessible price points.\n\nBy avoiding traditional mining, we eliminate human impact and environmental destruction while delivering VS+ clarity and F-G color brilliance.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
    date: "NOVEMBER 2024",
    readTime: "5 MIN READ"
  },
  {
    id: "art-3",
    title: "The Ultimate Guide to Caring for 18K Gold Vermeil",
    excerpt: "Essential care instructions to maintain the luster and thick golden finish of your VRIX jewelry for years.",
    content: "18K Gold Vermeil is a thick layer of solid 18K gold electroplated over pure 925 Sterling Silver. To preserve its luster:\n\n1. Store in your complimentary VRIX velvet pouch away from humidity.\n2. Avoid direct application of perfumes, lotions, or sanitizers.\n3. Clean softly using an un-treated microfiber cloth.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop",
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
        console.error("Error loading journal articles:", err);
        setArticles(DEFAULT_ARTICLES);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full bg-surface min-h-screen py-section-gap">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="font-label-caps text-xs text-slate-grey uppercase tracking-widest">
            Editorial Journal
          </p>
          <h1 className="font-display-lg text-headline-lg text-deep-navy uppercase">
            Stories & Craft
          </h1>
          <div className="w-16 h-px bg-slate-grey/30 mx-auto"></div>
          <p className="font-body-md text-sm text-slate-grey leading-relaxed">
            Delve into the design philosophy, sustainable sourcing narratives, and styling inspirations behind VRIX Fine Jewelry.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-grey font-body-md text-sm">
            No journal entries found. Check back soon.
          </div>
        ) : (
          /* Grid of Articles */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter pt-8">
            {articles.map((article) => (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group cursor-pointer bg-pure-white border border-slate-grey/10 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-soft-linen">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center text-[10px] font-label-caps text-slate-grey tracking-wider uppercase">
                      <span>{article.date}</span>
                      <span className="w-1.5 h-1.5 bg-slate-grey/30 rounded-full"></span>
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="font-headline-md text-deep-navy text-xl group-hover:text-ink-black transition-colors">
                      {article.title}
                    </h3>
                    <p className="font-body-md text-slate-grey text-sm leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 font-button text-button text-deep-navy group-hover:text-slate-grey transition-colors uppercase tracking-widest text-xs pt-2">
                    Read Article <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

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

              {/* Cover Image in Modal */}
              <div className="aspect-[16/9] relative bg-soft-linen w-full overflow-hidden border border-slate-grey/10">
                <Image
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 768px"
                />
              </div>

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
