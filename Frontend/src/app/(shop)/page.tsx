import { Metadata } from "next";
import HomepageClient from "./page.client";
import { fetchDbPublic, fetchProducts } from "@/utils/api";

export const dynamic = "force-dynamic";

const DEFAULT_SEO_SUBHEADING = "Luxury Minimalist Jewellery & Design";
const DEFAULT_SEO_HEADING = "Quiet Luxury & Architectural Form";
const DEFAULT_SEO_TEXT =
  "Welcome to VRIX, the ultimate destination for minimalist luxury jewelry and fine jewellery. Our design philosophy centers around quiet luxury, bringing you architectural, clean forms crafted from premium materials. Whether you are looking for premium gold vermeil rings, daily-wear minimalist necklaces, or elegant silver earrings and bracelets, our curated collections offer timeless pieces that speak in silence. By blending modern aesthetics with ethical, sustainable craftsmanship, VRIX redefines what fine jewelry online means for the conscious shopper. We cater to seekers of luxury jewelry worldwide, capturing the perfect balance of luxury minimalism and everyday durability. Experience the artistry of master goldsmiths and elevate your style with premium jewellery designed for the moments that belong only to you.";

export async function generateMetadata(): Promise<Metadata> {
  const dbRes = await fetchDbPublic().catch(() => null);
  const homepage = dbRes?.homepage || {};

  const title = homepage.seoHeading
    ? `VRIX | ${homepage.seoHeading}`
    : "VRIX | Luxury Minimalist Jewellery & Fine Jewelry Online";

  const description = homepage.seoText
    ? homepage.seoText.slice(0, 160).trim() + "..."
    : "Discover VRIX — luxury minimalist jewelry and fine jewellery. Crafted from ethical materials, featuring quiet luxury, rings, necklaces, earrings, and bracelets.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://vrixjewels.com",
    },
    openGraph: {
      title,
      description,
      url: "https://vrixjewels.com",
      siteName: "VRIX",
      images: [
        {
          url: "https://vrixjewels.com/logos/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "VRIX Fine Jewelry",
        },
      ],
    },
  };
}

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

  const seoHeading = homepageData?.homepage?.seoHeading || DEFAULT_SEO_HEADING;
  const seoText = homepageData?.homepage?.seoText || DEFAULT_SEO_TEXT;

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
    "description": seoText,
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
        <h1 className="sr-only">VRIX — {seoHeading}</h1>

        <HomepageClient initialData={homepageData} initialProducts={productsData} />
      </main>
    </>
  );
}
