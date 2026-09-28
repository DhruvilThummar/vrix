/**
 * VRIX E-Commerce Tracking Utility
 * Supports Meta Pixel (fbq) and Google Analytics / Google Ads (gtag)
 */

export interface TrackItem {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  variant?: string;
}

// Helper to safely get Meta Pixel (fbq)
const getFbq = () => {
  if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
    return (window as any).fbq;
  }
  return null;
};

// Helper to safely get Google gtag
const getGtag = () => {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    return (window as any).gtag;
  }
  return null;
};

/**
 * Track Product Detail View (Meta: ViewContent, GA4: view_item)
 */
export const trackViewContent = (item: TrackItem, currency: string = "INR") => {
  try {
    const fbq = getFbq();
    if (fbq) {
      fbq("track", "ViewContent", {
        content_name: item.name,
        content_category: item.category || "Jewelry",
        content_ids: [String(item.id)],
        content_type: "product",
        value: Number(item.price || 0),
        currency: currency,
      });
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("event", "view_item", {
        currency: currency,
        value: Number(item.price || 0),
        items: [
          {
            item_id: String(item.id),
            item_name: item.name,
            item_category: item.category || "Jewelry",
            item_variant: item.variant || "",
            price: Number(item.price || 0),
            quantity: 1,
          },
        ],
      });
    }
  } catch (err) {
    console.debug("Tracking ViewContent error:", err);
  }
};

/**
 * Track Add to Cart (Meta: AddToCart, GA4: add_to_cart)
 */
export const trackAddToCart = (item: TrackItem, currency: string = "INR") => {
  try {
    const quantity = item.quantity || 1;
    const fbq = getFbq();
    if (fbq) {
      fbq("track", "AddToCart", {
        content_name: item.name,
        content_category: item.category || "Jewelry",
        content_ids: [String(item.id)],
        content_type: "product",
        value: Number(item.price || 0) * quantity,
        currency: currency,
      });
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("event", "add_to_cart", {
        currency: currency,
        value: Number(item.price || 0) * quantity,
        items: [
          {
            item_id: String(item.id),
            item_name: item.name,
            item_category: item.category || "Jewelry",
            item_variant: item.variant || "",
            price: Number(item.price || 0),
            quantity: quantity,
          },
        ],
      });
    }
  } catch (err) {
    console.debug("Tracking AddToCart error:", err);
  }
};

/**
 * Track Initiate Checkout (Meta: InitiateCheckout, GA4: begin_checkout)
 */
export const trackInitiateCheckout = (
  items: TrackItem[],
  totalAmount: number,
  currency: string = "INR"
) => {
  try {
    const fbq = getFbq();
    if (fbq) {
      fbq("track", "InitiateCheckout", {
        content_ids: items.map((i) => String(i.id)),
        content_type: "product",
        num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: Number(totalAmount || 0),
        currency: currency,
      });
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("event", "begin_checkout", {
        currency: currency,
        value: Number(totalAmount || 0),
        items: items.map((i) => ({
          item_id: String(i.id),
          item_name: i.name,
          item_category: i.category || "Jewelry",
          item_variant: i.variant || "",
          price: Number(i.price || 0),
          quantity: i.quantity || 1,
        })),
      });
    }
  } catch (err) {
    console.debug("Tracking InitiateCheckout error:", err);
  }
};

/**
 * Track Purchase / Order Placed (Meta: Purchase, GA4: purchase)
 */
export const trackPurchase = (
  orderId: string,
  totalAmount: number,
  currency: string = "INR",
  items: TrackItem[] = []
) => {
  try {
    const fbq = getFbq();
    if (fbq) {
      fbq("track", "Purchase", {
        content_ids: items.map((i) => String(i.id)),
        content_type: "product",
        value: Number(totalAmount || 0),
        currency: currency,
        order_id: orderId,
      });
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("event", "purchase", {
        transaction_id: orderId,
        value: Number(totalAmount || 0),
        currency: currency,
        items: items.map((i) => ({
          item_id: String(i.id),
          item_name: i.name,
          item_category: i.category || "Jewelry",
          item_variant: i.variant || "",
          price: Number(i.price || 0),
          quantity: i.quantity || 1,
        })),
      });
    }
  } catch (err) {
    console.debug("Tracking Purchase error:", err);
  }
};
