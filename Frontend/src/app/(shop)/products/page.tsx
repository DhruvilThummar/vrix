import { fetchCollections, fetchProducts } from "@/utils/api";
import ProductsCatalogClient from "./ProductsCatalogClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All Fine Jewelry Online | VRIX",
  description: "Browse the complete VRIX fine jewelry catalog. Handcrafted minimal gold bands, luxury necklaces, earrings, and custom pieces.",
  alternates: {
    canonical: "https://vrixjewels.com/products",
  },
  openGraph: {
    title: "Shop All Fine Jewelry Online | VRIX",
    description: "Browse the complete VRIX fine jewelry catalog.",
    url: "https://vrixjewels.com/products",
  }
};

export default async function ProductsCatalogPage() {
  const [products, collections] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchCollections().catch(() => []),
  ]);

  // Embed Breadcrumbs JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://vrixjewels.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Catalog",
        "item": "https://vrixjewels.com/products"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Catalog...</div>}>
        <ProductsCatalogClient initialProducts={products} initialCollections={collections} />
      </Suspense>
    </>
  );
}
