import { Metadata } from "next";
import HomepageClient from "./page.client";
import { fetchDbPublic, fetchProducts } from "@/utils/api";

export const dynamic = "force-dynamic";

const DEFAULT_SEO_SUBHEADING = "Luxury Minimalist Jewellery & Lab-Grown Diamonds";
const DEFAULT_SEO_HEADING = "A Luxury That Feels Like You";
const DEFAULT_SEO_TEXT =
  "Welcome to VRIX — where luxury feels like you. Designed for those beginning their journey into fine jewellery, our collections blend lab-grown diamond artistry with architectural minimalism and high-quality craftsmanship. Positioned between gold-plated and heavy traditional gold jewellery, VRIX brings you quiet luxury, clean forms, and effortless elegance crafted to create a personal, meaningful connection for your everyday moments.";

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
