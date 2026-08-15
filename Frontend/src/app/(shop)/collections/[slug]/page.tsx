import { cache } from "react";
import { fetchCategories, fetchCollections, fetchProducts } from "@/utils/api";
import CollectionDetailClient from "./CollectionDetailClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 60;

const getCachedCollections = cache(() => fetchCollections().catch(() => []));
const getCachedCategories = cache(() => fetchCategories().catch(() => []));
const getCachedProducts = cache(() => fetchProducts().catch(() => []));

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  try {
    const [collections, categories] = await Promise.all([
      getCachedCollections(),
      getCachedCategories(),
    ]);

    const activeInfo = categories.find((c) => c.id === slug) || collections.find((c) => c.id === slug);
    const title = activeInfo
      ? `${activeInfo.title} | VRIX Fine Jewelry`
      : `${slug.charAt(0).toUpperCase() + slug.slice(1)} Collection | VRIX`;
      
    const description = activeInfo?.description || `Explore the VRIX ${slug} jewelry collection featuring minimal gold rings, silver necklaces, and fine pieces.`;
    const canonicalUrl = `https://vrixjewels.com/collections/${slug}`;

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
      }
    };
  } catch (e) {
    return { title: "Collections | VRIX" };
  }
}

export default async function CollectionDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const [products, collections, categories] = await Promise.all([
    getCachedProducts(),
    getCachedCollections(),
    getCachedCategories(),
  ]);

  const activeCategory = categories.find((c) => c.id === slug);
  let collectionInfo: any = {};
  if (activeCategory) {
    collectionInfo = {
      title: activeCategory.title,
      description: activeCategory.description || activeCategory.tagline || "",
      tagline: activeCategory.tagline || "",
      image: activeCategory.image || "",
      bannerImage: activeCategory.bannerImage || activeCategory.image || "",
      customHeadline: activeCategory.customHeadline || "",
      customParagraph: activeCategory.customParagraph || "",
      showProductCarousel: !!activeCategory.showProductCarousel,
      carouselAutoplay: !!activeCategory.carouselAutoplay,
      carouselSpeed: activeCategory.carouselSpeed || 3000,
      layoutStyle: activeCategory.layoutStyle || "classic",
      sections: activeCategory.sections || [],
      isCategory: true,
    };
    const targetNorm = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    const activeCollection = collections.find((c: any) => {
      if (!c) return false;
      const cIdNorm = (c.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cTitleNorm = (c.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cLinkNorm = (c.link || "").replace("/collections/", "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return cIdNorm === targetNorm || cTitleNorm === targetNorm || cLinkNorm === targetNorm || cIdNorm.includes(targetNorm) || targetNorm.includes(cIdNorm);
    });

    if (activeCollection) {
      collectionInfo = {
        title: activeCollection.title,
        description: activeCollection.description || activeCollection.tagline || "",
        tagline: activeCollection.tagline || "",
        image: activeCollection.image || "",
        bannerImage: activeCollection.bannerImage || "",
        customHeadline: activeCollection.customHeadline || "",
        customParagraph: activeCollection.customParagraph || "",
        showProductCarousel: !!activeCollection.showProductCarousel,
        carouselAutoplay: !!activeCollection.carouselAutoplay,
        carouselSpeed: activeCollection.carouselSpeed || 3000,
        layoutStyle: activeCollection.layoutStyle || "classic",
        sections: activeCollection.sections || [],
      };
    } else {
      const isNewArrivals = slug === "silent-center" || slug === "new-arrivals" || slug === "trending";
      collectionInfo = {
        title: isNewArrivals ? "New Arrivals / Trending" : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: isNewArrivals
          ? "Explore our latest handcrafted fine jewelry pieces, minimal gold rings, and architectural designs."
          : `Explore designer jewelry items from our ${slug.replace(/-/g, " ")} collection.`,
        layoutStyle: "classic",
      };
    }
  }

  // Embed BreadcrumbList JSON-LD
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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": collectionInfo.title,
        "item": `https://vrixjewels.com/collections/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Collection...</div>}>
        <CollectionDetailClient
          slug={slug}
          initialProducts={products}
          initialCollections={collections}
          initialCategories={categories}
          collectionInfo={collectionInfo}
        />
      </Suspense>
    </>
  );
}
