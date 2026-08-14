import { fetchCollections } from "@/utils/api";
import CollectionsClient from "./CollectionsClient";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Designer Jewelry Collections | VRIX",
  description: "Browse our signature jewelry collections. Architectural jewelry lines representing contemporary minimalism and luxury.",
  alternates: {
    canonical: "https://vrixjewels.com/collections",
  },
  openGraph: {
    title: "Designer Jewelry Collections | VRIX",
    description: "Browse our signature jewelry collections.",
    url: "https://vrixjewels.com/collections",
  }
};

export default async function CollectionsPage() {
  let collections = [];
  try {
    const res = await fetchCollections();
    if (Array.isArray(res)) collections = res;
  } catch (e) {
    console.error("Error fetching collections:", e);
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
        "name": "Collections",
        "item": "https://vrixjewels.com/collections"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CollectionsClient initialCollections={collections} />
    </>
  );
}
