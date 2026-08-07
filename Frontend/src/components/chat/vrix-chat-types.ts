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

export type MessageSender = "bot" | "user";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text?: string;
  options?: QuickOption[];
  products?: ChatProduct[];
  comparison?: ComparisonData;
  handoff?: HumanHandoffData;
  timestamp: string;
  isTyping?: boolean;
}

export interface EntryPoint {
  id: EntryPointId;
  label: string;
  icon: string;
  description: string;
}
