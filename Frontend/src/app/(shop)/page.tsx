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
      </main>
    </>
  );
}
