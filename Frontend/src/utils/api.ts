
import { getClientCache, setClientCache, precacheImages } from "./cacheStorage";

export async function apiFetchCached<T>(endpoint: string, ttlSeconds: number = 1800): Promise<T> {
  const cacheKey = `api_${endpoint.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const cached = await getClientCache<T>(cacheKey);
  if (cached !== null) {
    // Revalidate in background so IndexedDB cache is updated asynchronously
    apiFetch<T>(endpoint).then((freshData) => {
      setClientCache(cacheKey, freshData, ttlSeconds);
    }).catch(() => {});
    return cached;
  }

  const fresh = await apiFetch<T>(endpoint);
  setClientCache(cacheKey, fresh, ttlSeconds);
  return fresh;
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `${window.location.origin}/api`;
    }
  }
  return "http://127.0.0.1:5000/api";
}

export function getWishlistKey(email?: string): string {
  if (email && email.trim()) {
    return `vrix-wishlist_${email.trim().toLowerCase()}`;
  }
  return "vrix-wishlist";
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone?: string | null;
  address: string;
  apartment?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export async function fetchSavedAddresses(email: string): Promise<SavedAddress[]> {
  const result = await apiFetch<{ addresses: SavedAddress[] }>(`/auth/addresses?email=${encodeURIComponent(email)}`);
  return result.addresses || [];
}

export async function saveAddress(email: string, address: Omit<SavedAddress, "id">, id?: string): Promise<SavedAddress> {
  const result = await apiFetch<{ address: SavedAddress }>(id ? `/auth/addresses/${id}` : "/auth/addresses", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...address }),
  });
  return result.address;
}

export async function deleteSavedAddress(email: string, id: string): Promise<void> {
  await apiFetch(`/auth/addresses/${id}?email=${encodeURIComponent(email)}`, { method: "DELETE" });
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "vrix_admin_secret_change_me_in_production";

// ─── Helper ───────────────────────────────────────────────────────────────────
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith("/") ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API request failed");
  }
  return res.json();
}

// Admin-only fetch — auto-attaches X-Admin-Secret header
async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "X-Admin-Secret": ADMIN_SECRET,
    ...(options?.headers as Record<string, string> || {}),
  };
  return apiFetch<T>(endpoint, { ...options, headers });
}

// ══════════════════════════════════════════════════════════════════════════════
//  HEALTH
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchHealth() {
  return apiFetch<{
    status: string;
    dbMode: string;
    cloudinary: boolean;
    razorpay: boolean;
    nodemailer: boolean;
  }>("/health");
}


// ══════════════════════════════════════════════════════════════════════════════
//  DATABASE / CMS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchDb() {
  return apiFetch<any>("/db");
}

// Public variant — safe for shop-facing pages (strips api_settings secrets)
export async function fetchDbPublic() {
  return apiFetchCached<any>("/db/public", 3600);
}

export async function updateCMS(data: {
  homepage?: any;
  story?: any;
  legal?: any;
  navigation?: any[];
  footerLinks?: any[];
  brand?: any;
  features?: any;
  collections?: any;
  custom_pages?: any;
  api_settings?: any;
  vrix_plus?: any;
  bespoke_config?: any;
  gift_wrapping?: any;
  metal_types?: any[];
  announcement_bar?: any;
  invoice_settings?: any;
  currency_settings?: any;
  offers_page?: any;
}) {
  return adminFetch<any>("/cms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchGiftWrappingAPI() {
  return apiFetchCached<any>("/cms/gift-wrapping", 3600);
}

export async function fetchAnnouncementBarAPI() {
  return apiFetchCached<any>("/cms/announcement-bar", 3600);
}

export async function fetchHomepageCMSAPI() {
  return apiFetchCached<any>("/cms/homepage", 3600);
}

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchProducts() {
  const products = await apiFetchCached<any[]>("/products", 1800);
  if (Array.isArray(products)) {
    precacheImages(products.map((p: any) => p.image || p.images?.[0]).filter(Boolean));
  }
  return products;
}

export async function fetchProduct(id: string) {
  const product = await apiFetchCached<any>(`/products/${id}`, 1800);
  if (product && (product.image || Array.isArray(product.images))) {
    precacheImages([product.image, ...(product.images || [])].filter(Boolean));
  }
  return product;
}

export async function validateStock(items: Array<{ id: string; title: string; quantity: number }>) {
  return apiFetch<{ success: boolean; message?: string; outOfStockItems?: any[] }>("/products/validate-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export async function setWishlistStockAlert(email: string, productId: string, enabled: boolean) {
  return apiFetch<{ success: boolean; enabled: boolean }>("/products/wishlist-alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, productId, enabled }),
  });
}

export async function createProduct(productData: any) {
  return adminFetch<any>("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id: string, productData: any) {
  return adminFetch<any>(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(id: string) {
  return adminFetch<any>(`/products/${id}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════════════════════════
//  COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchCollections() {
  return apiFetch<any[]>("/collections");
}

// ══════════════════════════════════════════════════════════════════════════════
//  JOURNAL
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchJournal() {
  return apiFetch<any[]>("/journal");
}

export async function createJournalPost(postData: any) {
  return adminFetch<any>("/journal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
}

export async function updateJournalPost(id: string, postData: any) {
  return adminFetch<any>(`/journal/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
}

export async function deleteJournalPost(id: string) {
  return adminFetch<any>(`/journal/${id}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECURITY LOGS
// ══════════════════════════════════════════════════════════════════════════════
//  SECURITY & AUDIT LOGS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSecurityLogs() {
  return apiFetch<any[]>("/security/logs");
}

export async function addSecurityLog(logEntry: { event: string; user?: string; status: "SUCCESS" | "FAILED" }) {
  return apiFetch<any>("/security/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logEntry),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER ORDERS & TRACKING
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchUserOrders(email: string) {
  return apiFetch<any[]>(`/payment/user-orders?email=${encodeURIComponent(email)}`);
}

export async function trackOrder(query: string) {
  return apiFetch<any>(`/payment/track/${encodeURIComponent(query.trim())}`);
}

export async function fetchPaymentLogs() {
  return apiFetch<any[]>("/payment/logs");
}

// ══════════════════════════════════════════════════════════════════════════════
//  MEDIA UPLOAD
// ══════════════════════════════════════════════════════════════════════════════

export async function uploadMedia(file: File): Promise<{ url: string; public_id: string }> {
  const form = new FormData();
  form.append("file", file);
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/media/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function uploadMediaMultiple(files: File[]): Promise<{
  results: Array<{
    originalname: string;
    url?: string;
    public_id?: string;
    error?: string;
    success: boolean;
  }>;
}> {
  const form = new FormData();
  files.forEach((file) => {
    form.append("files", file);
  });
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/media/upload-multiple`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Multiple upload failed");
  }
  return res.json();
}

export async function fetchMedia(): Promise<{
  files: Array<{
    name: string;
    url: string;
    createdAt: string;
    size: number;
  }>;
}> {
  return apiFetch<{
    files: Array<{
      name: string;
      url: string;
      createdAt: string;
      size: number;
    }>;
  }>("/media");
}

// ══════════════════════════════════════════════════════════════════════════════
//  OTP
// ══════════════════════════════════════════════════════════════════════════════

export async function sendOtp(email: string) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, otp: string) {
  return apiFetch<{ success: boolean; email: string }>("/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
}

export async function sendTestEmail(recipientEmail: string) {
  return apiFetch<{ success: boolean; message?: string; error?: string; messageId?: string }>("/otp/test-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientEmail }),
  });
}

export async function registerUser(payload: any) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function confirmRegistration(payload: any) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string; isVrixPlusMember?: boolean } }>("/auth/register/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: any) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function confirmLogin(payload: any) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string; isVrixPlusMember?: boolean } }>("/auth/login/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUserDirect(payload: any) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string; isVrixPlusMember?: boolean } }>("/auth/login/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginWithGoogle(payload: { credential?: string; email?: string; name?: string; phone?: string; joinVrixPlus?: boolean }) {
  return apiFetch<{
    success: boolean;
    user: { email: string; name: string; phone: string; isVrixPlusMember?: boolean; vrixPlusJoinedDate?: string; picture?: string };
  }>("/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchUserProfile(email: string) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string; dateOfBirth?: string | null; isVrixPlusMember?: boolean } }>(`/auth/me?email=${encodeURIComponent(email)}`);
}


export async function adminLogin(payload: { email: string; password: string }) {
  return apiFetch<{ success: boolean; admin: { email: string; name: string; role: string } }>("/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PROMO / REDEEM CODES
// ══════════════════════════════════════════════════════════════════════════════

export async function verifyPromo(code: string, subtotal?: number) {
  return apiFetch<{ success: boolean; code: string; discount: number; type: "percentage" | "fixed" }>("/promo/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function fetchPromoCodes() {
  return apiFetch<any[]>("/promo/codes");
}

export async function createPromoCode(data: {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description?: string | null;
  minSubtotal?: number | null;
  usageLimit?: number | null;
  expiryDate?: string | null;
}) {
  return apiFetch<any>("/promo/codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePromoCode(code: string, data: any) {
  return apiFetch<any>(`/promo/codes/${code}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePromoCode(code: string) {
  return apiFetch<any>(`/promo/codes/${code}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════

export async function createPaymentOrder(data: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
  customerName?: string;
  customerPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}) {
  return apiFetch<{ success: boolean; order: any; devMode?: boolean; keyId?: string | null }>("/payment/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export interface PaymentGatewayConfig {
  enabled: boolean;
  keyId?: string | null; // Razorpay Key ID
  clientId?: string | null; // PayPal Client ID
  mode?: "sandbox" | "live" | null; // PayPal Mode
  devMode?: boolean;
  source: string;
}

export interface PaymentConfigResponse {
  razorpay: PaymentGatewayConfig;
  paypal: PaymentGatewayConfig;
  currency: string;
  // Fallbacks for legacy compatibility
  keyId: string | null;
  enabled: boolean;
  devMode: boolean;
  source: string;
}

export async function fetchPaymentConfig() {
  return apiFetch<PaymentConfigResponse>("/payment/config");
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items?: any[];
  promoCode?: string;
  isGiftWrapped?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
}) {
  return apiFetch<{ success: boolean; paymentId: string }>("/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createPayPalOrder(data: {
  amount: number;
  currency?: string;
  customerName?: string;
  customerPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: Record<string, any>;
  isGiftWrapped?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
}) {
  return apiFetch<{
    success: boolean;
    orderId: string;
    internalOrderId: string;
    approvalUrl: string | null;
  }>("/payment/paypal/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function capturePayPalOrder(data: {
  paypalOrderId: string;
  items?: any[];
  promoCode?: string;
  isGiftWrapped?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
  email?: string;
}) {
  return apiFetch<{
    success: boolean;
    captureId: string;
    orderId: string;
    paymentId: string;
  }>("/payment/paypal/capture-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  DELIVERY PANEL & STAFF APIs
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchDeliveryOrders(role?: string, email?: string) {
  let url = "/delivery/orders";
  if (role && email) {
    url += `?role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;
  }
  return apiFetch<any[]>(url);
}

export async function sendDeliveryOtp(orderId: string, customerEmail: string) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/delivery/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, customerEmail }),
  });
}

export async function verifyDeliveryOtp(orderId: string, otp: string) {
  return apiFetch<{ success: boolean; orderId: string }>("/delivery/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, otp }),
  });
}

export async function sendDeliveryAuthOtp(email: string) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/delivery/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function verifyDeliveryAuthOtp(email: string, otp: string) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; role: "agent" | "manager" } }>("/delivery/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
}

export async function fetchDeliveryStaff() {
  return apiFetch<any[]>("/delivery/staff");
}

export async function addDeliveryStaff(data: { email: string; name: string; role: "agent" | "manager" }) {
  return apiFetch<any>("/delivery/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteDeliveryStaff(email: string) {
  return apiFetch<{ success: boolean; email: string }>(`/delivery/staff/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

export async function assignDeliveryOrder(orderId: string, agentEmail: string | null) {
  return apiFetch<{ success: boolean; order: any }>(`/delivery/orders/${encodeURIComponent(orderId)}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentEmail }),
  });
}

export async function updateDeliveryEta(orderId: string, estimatedDeliveryDate: string) {
  return apiFetch<{ success: boolean; order: any; estimatedDeliveryDate: string }>(`/delivery/orders/${encodeURIComponent(orderId)}/eta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estimatedDeliveryDate }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — STATS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchAdminStats() {
  return adminFetch<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
    outOfStock: number;
    hiddenProducts: number;
    totalPromoCodes: number;
  }>("/admin/stats");
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — PRODUCT STOCK & VISIBILITY
// ══════════════════════════════════════════════════════════════════════════════

export async function updateProductStock(id: string, stock: number) {
  return adminFetch<any>(`/products/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock }),
  });
}

export async function updateProductVisibility(id: string, isVisible: boolean) {
  return adminFetch<any>(`/products/${id}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isVisible }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — COLLECTIONS MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchAllCollections() {
  return apiFetch<any[]>("/collections/all");
}

export async function saveCollections(collections: any[]) {
  return adminFetch<any>("/collections", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collections }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — CATEGORIES MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchCategories() {
  return apiFetch<any[]>("/categories");
}

export async function fetchAllCategories() {
  return apiFetch<any[]>("/categories/all");
}

export async function saveCategories(categories: any[]) {
  return adminFetch<any>("/categories", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — SITE CONFIG (features, brand, navigation, homepage, etc.)
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSiteConfig() {
  return adminFetch<Record<string, any>>("/config");
}

export async function saveSiteConfigKey(key: string, value: any) {
  return adminFetch<any>(`/config/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
}

export async function fetchUsers() {
  return adminFetch<any[]>("/admin/users");
}

export async function updateUserVrixPlus(email: string, isVrixPlusMember: boolean) {
  return adminFetch<{ success: boolean; user: any }>(`/admin/users/${encodeURIComponent(email)}/vrix-plus`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isVrixPlusMember }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchNotifications() {
  return adminFetch<any[]>("/notifications");
}

export async function markNotificationRead(id: string) {
  return adminFetch<{ success: boolean }>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return adminFetch<{ success: boolean }>("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function clearAllNotifications() {
  return adminFetch<{ success: boolean }>("/notifications/clear", {
    method: "DELETE",
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  BESPOKE ATELIER API
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchBespokeData() {
  return apiFetch<{
    settings: any;
    options: any[];
    variants: any[];
    metals: any[];
    silhouettes: any[];
    shapes: any[];
  }>("/bespoke");
}

export async function updateBespokeSettings(settings: any) {
  return adminFetch<{ success: boolean; settings: any }>("/bespoke/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export async function saveBespokeOption(option: any) {
  return adminFetch<{ success: boolean; option: any }>("/bespoke/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(option),
  });
}

export async function deleteBespokeOption(id: string) {
  return adminFetch<{ success: boolean; id: string }>(`/bespoke/options/${id}`, {
    method: "DELETE",
  });
}

export async function saveBespokeVariant(variant: any) {
  return adminFetch<{ success: boolean; variant: any }>("/bespoke/variants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variant),
  });
}

export async function deleteBespokeVariant(id: string) {
  return adminFetch<{ success: boolean; id: string }>(`/bespoke/variants/${id}`, {
    method: "DELETE",
  });
}


