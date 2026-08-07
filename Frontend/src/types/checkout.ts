export interface ShippingData {
  email: string;
  fullName: string;
  country: string;
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  phone: string;
  grandTotal: number;
  currency: string;
}

export interface OrderDetails {
  orderId: string;
  paymentId?: string;
  amount: number;
  email: string;
  name: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayResponse) => void | Promise<void>;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface TaxBreakdown {
  currency: string;
  isIndia: boolean;
  baseAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  vatRate: number;
}
