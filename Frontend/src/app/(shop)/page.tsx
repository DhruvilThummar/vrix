import { Metadata } from "next";
import HomepageClient from "./page.client";
import { fetchDbPublic, fetchProducts } from "@/utils/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VRIX | Luxury Minimalist Jewellery & Fine Jewelry Online",
  description:
    "Discover VRIX — luxury minimalist jewelry and fine jewellery. Crafted from ethical materials, featuring quiet luxury, rings, necklaces, earrings, and bracelets.",
  alternates: {
    canonical: "https://vrixjewels.com",
  },
};

export default async function Page() {
  let homepageData = null;
  let productsData: any[] = [];

  try {
    const [dbRes, productsRes] = await Promise.all([
      fetchDbPublic().catch(() => null),
      fetchProducts().catch(() => []),
    ]);
    homepageData = dbRes;
    productsData = productsRes || [];
  } catch (error) {
    console.error("Error fetching homepage data on server:", error);
  }

  // Generate JSON-LD Schema
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VRIX",
    "url": "https://vrixjewels.com",
    "logo": "https://vrixjewels.com/logos/og-image.jpg",
    "sameAs": [
      "https://www.instagram.com/vrixjewels",
      "https://www.facebook.com/vrixjewels",
    ],
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://vrixjewels.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vrixjewels.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />

      <main className="w-full">
        {/* H1 for SEO Visibility */}
        <h1 className="sr-only">VRIX — Luxury Minimalist Jewellery & Fine Jewelry Online</h1>

        <HomepageClient initialData={homepageData} initialProducts={productsData} />

        {/* 150+ word SEO intro block naturally using both spellings */}
        <section className="bg-soft-linen/10 py-16 border-t border-slate-grey/10">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <h2 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest mb-4">
              Luxury Minimalist Jewellery &amp; Design
            </h2>
            <p className="font-body-md text-xs text-slate-grey leading-relaxed text-justify md:text-center max-w-3xl mx-auto">
              Welcome to VRIX, the ultimate destination for minimalist luxury jewelry and fine jewellery. 
              Our design philosophy centers around quiet luxury, bringing you architectural, clean forms crafted 
              from premium materials. Whether you are looking for premium gold vermeil rings, daily-wear minimalist necklaces, 
              or elegant silver earrings and bracelets, our curated collections offer timeless pieces that speak in silence. 
              By blending modern aesthetics with ethical, sustainable craftsmanship, VRIX redefines what fine jewelry online 
              means for the conscious shopper. We cater to seekers of luxury jewelry worldwide, capturing the perfect balance 
              of luxury minimalism and everyday durability. Experience the artistry of master goldsmiths and elevate your style 
              with premium jewellery designed for the moments that belong only to you.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
