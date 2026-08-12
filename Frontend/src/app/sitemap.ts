import { MetadataRoute } from "next";
import { fetchProducts, fetchCollections, fetchCategories } from "@/utils/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrixjewels.com";

  // Static routes
  const staticRoutes = [
    "",
    "/behind-the-design",
    "/bespoke",
    "/careers",
    "/craftsmanship",
    "/journal",
    "/materials",
    "/sustainability",
    "/vrix-plus",
    "/collections",
    "/products",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    // Dynamic products
    const products = await fetchProducts().catch(() => []);
    const productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.createdAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Dynamic collections and categories
    const [collections, categories] = await Promise.all([
      fetchCollections().catch(() => []),
      fetchCategories().catch(() => []),
    ]);

    const collectionRoutes = collections.map((col: any) => ({
      url: `${baseUrl}/collections/${col.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryRoutes = categories.map((cat: any) => ({
      url: `${baseUrl}/collections/${cat.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes, ...collectionRoutes, ...categoryRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}
