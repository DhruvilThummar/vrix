export type OrderStatus =
  | "created"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  material?: string;
  size?: string;
  engravingText?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus | string;
  userEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  assignedAgent?: string | null;
  createdAt: string | Date;
}

export interface DeliveryStaff {
  email: string;
  name: string;
  role: "agent" | "manager";
  createdAt?: string | Date;
}
