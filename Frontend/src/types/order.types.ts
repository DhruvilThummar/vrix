export type DeliveryStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "PAID"
  | "PROCESSING"
  | "OTP_SENT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  material?: string;
  size?: string;
  engraving?: string;
  engravingText?: string;
  giftNote?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
  amount: number;
  currency: string;
  status: DeliveryStatus | string;
  userEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  assignedAgent?: string | null;
  cartItems?: string | OrderItem[] | null;
  isGiftWrapped?: boolean;
  giftMessage?: string | null;
  giftWrapPrice?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderTrackingDetails extends PaymentRecord {
  parsedItems: OrderItem[];
  estimatedDeliveryDate: string;
  formattedEtaLabel: string;
  currentStep: number; // 1: Placed, 2: Paid/Processing, 3: Out for Delivery, 4: Delivered
  stepProgressPercentage: number;
}

export interface DeliveryStaff {
  email: string;
  name: string;
  role: "agent" | "manager";
  createdAt?: string | Date;
}
