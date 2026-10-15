export type EntryPointId =
  | "myself"
  | "gift"
  | "collections"
  | "discovery"
  | "compare"
  | "education"
  | "warranty";

export interface QuickOption {
  label: string;
  value: string;
  actionId?: string;
  payload?: any;
}

export interface ChatProduct {
  id: string;
  title: string;
  category: string;
  material: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  whyFits?: string;
  stone?: string;
  warranty?: string;
  slug?: string;
}

export interface ComparisonData {
  products: ChatProduct[];
}

export interface HumanHandoffData {
  title: string;
  description: string;
  phone: string;
  instagram: string;
  linkedin: string;
  mapsUrl: string;
  businessProfileUrl: string;
}

export interface BespokeEstimateData {
  pieceType: string;
  metalChoice: string;
  estimatedPriceRange: string;
  leadTime: string;
}

export interface SocialLinksData {
  title?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface EmailCollectorData {
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  isSubmitted?: boolean;
}

export interface SaleDiscountCardData {
  highlight: string;
  code: string;
  description?: string;
  validUntil?: string;
  ctaUrl?: string;
}

export type MessageSender = "bot" | "user";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text?: string;
  options?: QuickOption[];
  products?: ChatProduct[];
  comparison?: ComparisonData;
  handoff?: HumanHandoffData;
  bespokeEstimate?: BespokeEstimateData;
  socialLinks?: SocialLinksData;
  emailCollector?: EmailCollectorData;
  saleDiscountCard?: SaleDiscountCardData;
  timestamp: string;
  isTyping?: boolean;
}

export interface EntryPoint {
  id: EntryPointId | string;
  label: string;
  icon: string;
  description: string;
}

