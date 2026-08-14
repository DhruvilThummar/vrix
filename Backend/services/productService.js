
import { prisma, isDbConnected } from "../config/prismaClient.js";
import { supabase } from "../config/supabaseClient.js";

export const productSelect = {
  id: true,
  title: true,
  subtitle: true,
  material: true,
  type: true,
  price: true,
  originalPrice: true,
  image: true,
  images: true,
  description: true,
  alt: true,
  sku: true,
  collection: true,
  stock: true,
  isVisible: true,
  isVrixPlusExclusive: true,
  vrixPlusPrice: true,
  layoutStyle: true,
  engravingOptions: true,
  giftNoteOptions: true,
  weight: true,
  dimensions: true,
  availableSizes: true,
  variants: true,
  comparisonOptions: true,
  giftOptions: true,
  deliveryPolicy: true,
  careGuide: true,
  tags: true,
  createdAt: true,
};

export const productSelectCompact = {
  id: true,
  title: true,
  subtitle: true,
  material: true,
  type: true,
  price: true,
  originalPrice: true,
  image: true,
  collection: true,
  stock: true,
  isVisible: true,
  isVrixPlusExclusive: true,
  vrixPlusPrice: true,
  sku: true,
  tags: true,
  createdAt: true,
};

export const productSelectWithoutImages = {
  id: true,
  title: true,
  subtitle: true,
  material: true,
  type: true,
  price: true,
  image: true,
  description: true,
  alt: true,
  collection: true,
  stock: true,
  createdAt: true,
};

export const toPgProductData = (data = {}) => {
  const pgData = {};
  if (data.id !== undefined) pgData.id = data.id;
  if (data.title !== undefined) pgData.title = data.title;
  if (data.subtitle !== undefined) pgData.subtitle = data.subtitle;
  if (data.material !== undefined) pgData.material = data.material;
  if (data.type !== undefined) pgData.type = data.type;
  if (data.price !== undefined) pgData.price = data.price;
  if (data.originalPrice !== undefined) pgData.original_price = data.originalPrice;
  if (data.image !== undefined) pgData.image = data.image;
  if (data.images !== undefined) pgData.images = data.images;
  if (data.description !== undefined) pgData.description = data.description;
  if (data.alt !== undefined) pgData.alt = data.alt;
  if (data.sku !== undefined) pgData.sku = data.sku;
  if (data.collection !== undefined) pgData.collection = data.collection;
  if (data.stock !== undefined) pgData.stock = data.stock;
  if (data.isVisible !== undefined) pgData.is_visible = data.isVisible;
  if (data.isVrixPlusExclusive !== undefined) pgData.is_vrix_plus_exclusive = data.isVrixPlusExclusive;
  if (data.vrixPlusPrice !== undefined) pgData.vrix_plus_price = data.vrixPlusPrice;
  if (data.layoutStyle !== undefined) pgData.layout_style = data.layoutStyle;
  if (data.engravingOptions !== undefined) pgData.engraving_options = data.engravingOptions;
  if (data.giftNoteOptions !== undefined) pgData.gift_note_options = data.giftNoteOptions;
  if (data.weight !== undefined) pgData.weight = data.weight;
  if (data.dimensions !== undefined) pgData.dimensions = data.dimensions;
  if (data.availableSizes !== undefined) pgData.available_sizes = data.availableSizes;
  if (data.variants !== undefined) pgData.variants = data.variants;
  if (data.comparisonOptions !== undefined) pgData.comparison_options = data.comparisonOptions;
  if (data.giftOptions !== undefined) pgData.gift_options = data.giftOptions;
  if (data.deliveryPolicy !== undefined) pgData.delivery_policy = data.deliveryPolicy;
  if (data.careGuide !== undefined) pgData.care_guide = data.careGuide;
  if (data.tags !== undefined) pgData.tags = data.tags;
  return pgData;
};

export const withProductDefaults = (product) => {
  if (!product) return product;
  return {
    ...product,
    images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
    isVisible: product.isVisible !== undefined ? product.isVisible : (product.is_visible !== undefined ? product.is_visible : true),
    isVrixPlusExclusive: product.isVrixPlusExclusive !== undefined ? !!product.isVrixPlusExclusive : !!product.is_vrix_plus_exclusive,
    vrixPlusPrice: product.vrixPlusPrice ?? product.vrix_plus_price ?? null,
    originalPrice: product.originalPrice ?? product.original_price ?? null,
    layoutStyle: product.layoutStyle || product.layout_style || "2x2",
    sku: product.sku || "",
    engravingOptions: product.engravingOptions || product.engraving_options || { enabled: false, limit: 25, price: 0 },
    giftNoteOptions: product.giftNoteOptions || product.gift_note_options || { enabled: false, limit: 150, price: 0 },
    weight: product.weight || "",
    dimensions: product.dimensions || "",
    availableSizes: Array.isArray(product.availableSizes) ? product.availableSizes : (Array.isArray(product.available_sizes) ? product.available_sizes : []),
    variants: Array.isArray(product.variants) ? product.variants : [],
    comparisonOptions: product.comparisonOptions || product.comparison_options || { worthIndex: 5, hardness: 5, shine: 5, styleRating: 5 },
    giftOptions: product.giftOptions || product.gift_options || { wrappingPrice: 0, showCustomBox: false, packagingNote: "" },
    deliveryPolicy: product.deliveryPolicy || product.delivery_policy || "We accept returns within 30 days of receipt in original, unworn condition. Engraved items are final sale.",
    careGuide: product.careGuide || product.care_guide || "Avoid contact with harsh chemicals, perfumes, and lotions. Store in the provided VRIX pouch when not in use. Clean gently with a soft polishing cloth.",
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
};

const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Product Microservice DB query timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

const runProductQuery = async (queryWithImages, queryWithoutImages) => {
  try {
    const res = await withTimeout(queryWithImages(), 500);
    return Array.isArray(res) ? res.map(withProductDefaults) : withProductDefaults(res);
  } catch (error) {
    if (supabase) {
      try {
        const { data, error: sErr } = await withTimeout(
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          400
        );
        if (!sErr && data) return data.map(withProductDefaults);
      } catch (e) {}
    }
    if (queryWithoutImages) {
      try {
        const res = await withTimeout(queryWithoutImages(), 300);
        return Array.isArray(res) ? res.map(withProductDefaults) : withProductDefaults(res);
      } catch (e) {}
    }
    throw error;
  }
};

export const productService = {
  findMany: async () => {
    if (isDbConnected && prisma) {
      try {
        return await runProductQuery(
          () => prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            select: productSelectCompact
          }),
          () => prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            select: productSelectCompact
          })
        );
      } catch (err) {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
          if (!error && data) return data.map(withProductDefaults);
        }
        return [];
      }
    } else if (supabase) {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error && data) return data.map(withProductDefaults);
    }
    return [];
  },

  findUnique: async (arg) => {
    const id = typeof arg === "string" ? arg : (arg?.where?.id || arg?.id);
    if (!id) return null;

    if (isDbConnected && prisma) {
      try {
        return await runProductQuery(
          () => prisma.product.findUnique({ where: { id }, select: productSelect }),
          () => prisma.product.findUnique({ where: { id }, select: productSelectWithoutImages })
        );
      } catch (err) {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
          if (!error && data) return withProductDefaults(data);
        }
        return null;
      }
    } else if (supabase) {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!error && data) return withProductDefaults(data);
    }
    return null;
  },

  create: async (arg) => {
    const data = (arg && typeof arg === "object" && arg.data !== undefined) ? arg.data : arg;
    if (!data || typeof data !== "object") throw new Error("Product payload is required for creation.");

    if (isDbConnected && prisma) {
      try {
        return await runProductQuery(
          () => prisma.product.create({ data, select: productSelect }),
          () => prisma.product.create({ data, select: productSelectWithoutImages })
        );
      } catch (err) {
        if (supabase) {
          const pgData = toPgProductData(data);
          const { data: sRes, error } = await supabase.from("products").insert([pgData]).select().single();
          if (!error && sRes) return withProductDefaults(sRes);
        }
        throw err;
      }
    } else if (supabase) {
      const pgData = toPgProductData(data);
      const { data: sRes, error } = await supabase.from("products").insert([pgData]).select().single();
      if (!error && sRes) return withProductDefaults(sRes);
      throw error;
    }
    throw new Error("Product Microservice: Storage unavailable.");
  },

  update: async (arg1, arg2) => {
    let id;
    let data;
    if (typeof arg1 === "string") {
      id = arg1;
      data = arg2;
    } else if (arg1 && typeof arg1 === "object") {
      id = arg1.where?.id || arg1.id;
      data = arg1.data !== undefined ? arg1.data : arg2;
    }

    if (!id || !data) throw new Error("Product ID and update payload are required.");

    if (isDbConnected && prisma) {
      try {
        return await runProductQuery(
          () => prisma.product.update({ where: { id }, data, select: productSelect }),
          () => prisma.product.update({ where: { id }, data, select: productSelectWithoutImages })
        );
      } catch (err) {
        if (supabase) {
          const pgData = toPgProductData(data);
          const { data: sRes, error } = await supabase.from("products").update(pgData).eq("id", id).select().single();
          if (!error && sRes) return withProductDefaults(sRes);
        }
        throw err;
      }
    } else if (supabase) {
      const pgData = toPgProductData(data);
      const { data: sRes, error } = await supabase.from("products").update(pgData).eq("id", id).select().single();
      if (!error && sRes) return withProductDefaults(sRes);
      throw error;
    }
    throw new Error("Product Microservice: Storage unavailable.");
  },

  exists: async (arg) => {
    const id = typeof arg === "string" ? arg : (arg?.where?.id || arg?.id);
    if (!id) return false;
    const p = await productService.findUnique(id);
    return !!p;
  },

  delete: async (arg) => {
    const id = typeof arg === "string" ? arg : (arg?.where?.id || arg?.id);
    if (!id) return false;

    if (isDbConnected && prisma) {
      try {
        await prisma.product.delete({ where: { id } });
        if (supabase) await supabase.from("products").delete().eq("id", id);
        return true;
      } catch (err) {
        if (supabase) {
          await supabase.from("products").delete().eq("id", id);
          return true;
        }
        throw err;
      }
    } else if (supabase) {
      await supabase.from("products").delete().eq("id", id);
      return true;
    }
    return false;
  }
};
