import { fetchCategories } from "@/utils/api";
import CategoriesClient from "./CategoriesClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  {
    id: "necklace",
    title: "Necklace",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/z7ekw55bkfo527ivhzme.png",
    link: "/collections/necklace",
    isVisible: true,
  },
  {
    id: "earrings",
    title: "Earrings",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/apetikskyjypxmrcvdwe.png",
    link: "/collections/earrings",
    isVisible: true,
  },
  {
    id: "bracelets",
    title: "Bracelets",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/cksu4mgtvw5iowjpe2h8.png",
    link: "/collections/bracelets",
    isVisible: true,
  },
  {
    id: "rings",
    title: "Rings",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i3fkvzr4zlvqbnhzjixd.png",
    link: "/collections/rings",
    isVisible: true,
  },
  {
    id: "charms",
    title: "Charms",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i0mfwsxjrxpdkdti4sp7.png",
    link: "/collections/charms",
    isVisible: true,
  },
];

export const metadata: Metadata = {
  title: "Shop Luxury Jewelry by Category | VRIX",
  description: "Browse our atelier selection of minimalist rings, necklaces, earrings, and bracelets handcrafted with premium metals.",
  alternates: {
    canonical: "https://vrixjewels.com/categories",
  },
  openGraph: {
    title: "Shop Luxury Jewelry by Category | VRIX",
    description: "Browse our atelier selection of minimalist rings, necklaces, earrings, and bracelets.",
    url: "https://vrixjewels.com/categories",
  }
};

export default async function CategoriesPage() {
  let categories = [];
  try {
    const res = await fetchCategories();
    categories = Array.isArray(res) && res.length > 0 ? res : DEFAULT_CATEGORIES;
  } catch (e) {
    categories = DEFAULT_CATEGORIES;
  }

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
        "name": "Categories",
        "item": "https://vrixjewels.com/categories"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoriesClient initialCategories={categories} />
    </>
  );
}
