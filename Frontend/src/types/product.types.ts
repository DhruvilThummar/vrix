export type ProductCategory = "Necklaces" | "Earrings" | "Rings" | "Bracelets" | "Bespoke" | "Jewelry";

export type MaterialType =
  | "18K Solid Yellow Gold"
  | "18K White Gold"
  | "18K Recycled Gold"
  | "950 Platinum"
  | "925 Sterling Silver"
  | "18K Gold Vermeil"
  | string;

export interface EngravingOption {
  enabled: boolean;
  maxCharacters?: number;
  fontStyles?: string[];
  price?: number;
}

export interface ComparisonOption {
  carat?: string;
  clarity?: string;
  cutGrade?: string;
  metalPurity?: string;
  weightGrams?: number;
  dimensionsMm?: string;
  worthIndex?: number;
  hardness?: number;
  shine?: number;
  styleRating?: number;
  styleMatching?: number;
}

export interface GiftNoteOption {
  enabled: boolean;
  maxCharacters?: number;
  paperType?: string;
}

export interface ProductVariant {
  id: string;
  material: string;
  label?: string;
  price?: number | null;
  originalPrice?: number | null;
  stock?: number;
  image?: string;
  images?: string[];
  isAvailable?: boolean;
  sku?: string;
  weight?: string;
  dimensions?: string;
  description?: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  material?: string | null;
  type: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[] | Record<string, any> | null;
  description?: string | null;
  alt?: string | null;
  sku?: string | null;
  collection?: string | null;
  stock: number;
  isVisible: boolean;
  isVrixPlusExclusive: boolean;
  vrixPlusPrice?: number | null;
  layoutStyle?: "1x1" | "2x2" | "banner" | string | null;
  engravingOptions?: EngravingOption | null;
  giftNoteOptions?: GiftNoteOption | null;
  giftOptions?: {
    wrappingPrice?: number;
    showCustomBox?: boolean;
    packagingNote?: string;
  } | null;
  weight?: string | null;
  dimensions?: string | null;
  availableSizes?: string[] | number[] | null;
  variants?: ProductVariant[] | null;
  comparisonOptions?: ComparisonOption | null;
  deliveryPolicy?: string | null;
  careGuide?: string | null;
  tags?: string[] | null;
  whyFits?: string;
  slug?: string;
  createdAt?: string | Date;
}
