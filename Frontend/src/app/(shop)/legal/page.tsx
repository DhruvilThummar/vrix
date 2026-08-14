"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_LEGAL: any = {
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "1. Introduction",
        content: "At VRIX, we are committed to protecting the privacy and security of our clients. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or interact with our brand.\n\nBy engaging with VRIX, you consent to the data practices described in this statement. We prioritize transparency and aim to ensure you have full control over your personal data."
      },
      {
        title: "2. Information We Collect",
        content: "We collect information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, or otherwise contact us. The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use.\n\n- Personal Identity Data: Name, email address, postal address, phone number.\n- Financial Data: Payment instrument details (e.g., credit card number) processed securely through our payment gateways.\n- Usage Data: Information about how you navigate and interact with our digital platforms."
      },
      {
        title: "3. How We Use Your Information",
        content: "We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.\n\n- To facilitate account creation and logon process.\n- To fulfill and manage your bespoke orders and standard purchases.\n- To deliver targeted advertising and curated gallery updates to you.\n- To protect our Services from fraudulent transactions."
      }
    ]
  },
  shipping: {
    title: "Shipping Policy",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "1. Dispatch & Timing",
        content: "All standard orders are processed and dispatched within 1-2 business days. Bespoke and customized jewelry selections require up to 4 weeks of craftsmanship time prior to dispatch."
      },
      {
        title: "2. Delivery Rates & Insurance",
        content: "Complimentary standard delivery is included on all purchases over $150. For orders below this threshold, shipping rates are calculated at checkout. Worldwide express shipping options are available with our premium logistics partners (DHL/FedEx)."
      },
      {
        title: "3. Signature Requirement",
        content: "For your security, all VRIX shipments require an adult signature upon delivery. We are unable to ship to PO Boxes, APO, or FPO addresses."
      }
    ]
  },
  returns: {
    title: "Returns & Exchanges Policy",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "1. Return Window",
        content: "VRIX offers a 30-day return policy for standard, non-customized pieces. Items must be returned in unworn, pristine condition with all original packaging, certificates, and safety tags intact."
      },
      {
        title: "2. Non-Returnable Items",
        content: "Bespoke commissions, custom configurations created via the modular builder, and personalized engravings are made uniquely for you. These selections are final sale and cannot be returned, exchanged, or canceled."
      },
      {
        title: "3. Returns Processing",
        content: "To initiate a return, please contact our Customer Care team. We will provide a pre-paid shipping label. Once received and inspected, refunds will be credited back to your original payment method within 5-7 business days."
      }
    ]
  },
  terms: {
    title: "Terms & Conditions",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "1. Intellectual Property Rights",
        content: "All designs, jewelry architectural concepts, CAD templates, visual graphics, metadata, and brand names featured on VRIX digital platforms are the exclusive property of VRIX and are protected by international trademark and copyright laws."
      },
      {
        title: "2. Bespoke Contracts",
        content: "Submitting an order via the Bespoke configurator constitutes an immediate authorization of metals and stone processing. Orders enter production instantly and are subject to final sale rules."
      },
      {
        title: "3. Limitation of Liability",
        content: "VRIX jewelry is crafted for delicate fashion and lifestyle use. We are not liable for incidental damage, stone loss, or shape distortions stemming from wear patterns outside of our recommended Care Guide guidelines."
      }
    ]
  },
  faq: {
    title: "Frequently Asked Questions",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "How long do Bespoke orders take?",
        content: "Bespoke and customized jewelry selections require up to 4 weeks of craftsmanship time prior to dispatch. Each piece is meticulously designed and handmade by our master artisans to ensure our precise quality standards."
      },
      {
        title: "What are the shipping fees?",
        content: "Complimentary standard shipping is included on all purchases over $150. For orders below this threshold, shipping rates are calculated at checkout. Worldwide express shipping options are available with our premium logistics partners (DHL/FedEx)."
      },
      {
        title: "What is the return window?",
        content: "VRIX offers a 30-day return policy for standard, non-customized pieces. Items must be returned in unworn, pristine condition with all original packaging, certificates, and safety tags intact. Bespoke commissions and custom engravings are final sale."
      },
      {
        title: "Can I modify my order after placing it?",
        content: "Standard orders can be changed or canceled within 1 hour of placement by contacting Customer Care. Bespoke configurations enter production immediately and cannot be modified."
      }
    ]
  },
  care: {
    title: "Care Guide",
    lastUpdated: "October 2024",
    sections: [
      {
        title: "1. Fine Metals Care",
        content: "To maintain the architectural brilliance of VRIX platinum and gold pieces, we recommend cleaning them with a soft-bristled brush and mild soapy warm water. Rinse thoroughly and dry with a lint-free cloth. Professional polishing is recommended annually to remove surface micro-scratches."
      },
      {
        title: "2. Gemstone Care",
        content: "Protect delicate gemstones (such as emeralds, opals, and pearls) from extreme heat, ultrasonic cleaners, and harsh chemicals. Diamonds, sapphires, and rubies can withstand standard gentle jewelry cleaners but should still be handled with care to prevent setting looseness."
      },
      {
        title: "3. Storage & Wearing Recommendations",
        content: "Always store your jewelry individually in its original VRIX soft-lined pouch or a velvet-lined box to prevent pieces from scratching each other. Avoid wearing your jewelry during physical activities, swimming in chlorinated water, or applying perfumes, lotions, and cosmetics."
      }
    ]
  }
};

function LegalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("privacy");
  const [legalData, setLegalData] = useState<any>(DEFAULT_LEGAL);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res && res.legal && typeof res.legal === "object") {
          setLegalData((prev: any) => ({ ...DEFAULT_LEGAL, ...res.legal }));
        }
      })
      .catch((err) => console.error("Error loading legal content:", err));
  }, []);

  useEffect(() => {
    if (tabParam && ["privacy", "shipping", "returns", "terms", "faq", "care"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/legal?tab=${tab}`, { scroll: false });
  };

  const activeContent = legalData[activeTab] || DEFAULT_LEGAL[activeTab] || DEFAULT_LEGAL["privacy"];

  return (
    <div className="w-full bg-surface min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
        
        {/* Left Sidebar navigation: Visible on desktop */}
        <aside className="lg:col-span-3 hidden lg:block">
          <nav className="sticky top-[100px] flex flex-col gap-6">
            <h3 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest border-b border-slate-grey/15 pb-2">
              Legal & Policies
            </h3>
            <ul className="flex flex-col gap-2 border-l border-slate-grey/20 pl-4">
              {Object.keys(DEFAULT_LEGAL).map((key) => (
                <li key={key}>
                  <button
                    onClick={() => handleTabChange(key)}
                    className={`font-label-caps text-xs tracking-wider uppercase transition-colors py-1 cursor-pointer block text-left ${
                      activeTab === key
                        ? "text-deep-navy font-bold text-sm -ml-[17px] border-l-2 border-deep-navy pl-3"
                        : "text-slate-grey hover:text-ink-black"
                    }`}
                  >
                    {DEFAULT_LEGAL[key].title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile Tab selector */}
        <div className="lg:hidden col-span-1 border-b border-slate-grey/20 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {Object.keys(DEFAULT_LEGAL).map((key) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`font-label-caps text-xs uppercase tracking-wider px-4 py-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === key
                    ? "bg-deep-navy text-pure-white"
                    : "bg-pure-white text-slate-grey border border-slate-grey/20"
                }`}
              >
                {DEFAULT_LEGAL[key].title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <article className="lg:col-span-9">
          
          {activeContent && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">
                  {activeContent.title}
                </h1>
                <p className="font-body-md text-xs text-slate-grey mt-1">
                  Last Updated: {activeContent.lastUpdated || "October 2024"}
                </p>
              </header>

              <section className="space-y-6">
                {activeContent.sections && activeContent.sections.map((section: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <h2 className="font-headline-md text-base text-ink-black font-semibold">
                      {section.title}
                    </h2>
                    <div className="font-body-md text-sm text-slate-grey leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                    {idx < activeContent.sections.length - 1 && (
                      <hr className="border-t border-slate-grey/10 pt-4" />
                    )}
                  </div>
                ))}
              </section>
            </div>
          )}

        </article>
      </main>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={
      <div className="w-full bg-surface min-h-screen flex items-center justify-center">
        <p className="font-body-md text-slate-grey animate-pulse">Loading Policies...</p>
      </div>
    }>
      <LegalPageContent />
    </Suspense>
  );
}
