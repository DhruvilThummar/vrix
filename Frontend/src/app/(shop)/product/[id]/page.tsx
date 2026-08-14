import { cache } from "react";
import { fetchProduct, fetchProducts } from "@/utils/api";
import ProductPageClient from "./ProductPageClient";
import { Metadata } from "next";

export const revalidate = 60;

const getCachedProduct = cache((id: string) => fetchProduct(id).catch(() => null));
const getCachedProducts = cache(() => fetchProducts().catch(() => []));

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product = await getCachedProduct(resolvedParams.id);
    if (!product) return { title: "Product Not Found | VRIX" };

    const title = `${product.title} — ${product.material || product.subtitle || "Fine"} ${product.type || "Jewelry"} | VRIX`;
    const description = product.description
      ? product.description.slice(0, 155) + (product.description.length > 155 ? "..." : "")
      : `Shop the exquisite ${product.title} fine jewelry online at VRIX. Handcrafted luxury pieces.`;

    const canonicalUrl = `https://vrixjewels.com/product/${resolvedParams.id}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: [{ url: product.image, alt: product.title }],
      },
    };
  } catch (e) {
    return { title: "VRIX Fine Jewelry" };
  }
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const [product, allProducts] = await Promise.all([
    getCachedProduct(resolvedParams.id),
    getCachedProducts(),
  ]);

  // Embed Product JSON-LD server-side
  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.image,
    "description": product.description || `Handcrafted ${product.title} fine jewelry.`,
    "sku": product.sku || `VRIX-${product.id.toUpperCase()}`,
    "brand": {
      "@type": "Brand",
      "name": "VRIX"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://vrixjewels.com/product/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  } : null;

  // Embed Breadcrumbs JSON-LD
  const breadcrumbJsonLd = product ? {
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
        "name": "Collections",
        "item": "https://vrixjewels.com/collections"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.title,
        "item": `https://vrixjewels.com/product/${product.id}`
      }
    ]
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductPageClient initialProduct={product} allProducts={allProducts} />
    </>
  );
}
