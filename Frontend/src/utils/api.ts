
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "vrix_admin_secret_change_me_in_production";

// ─── Helper ───────────────────────────────────────────────────────────────────
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
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
    truecaller: boolean;
    truecallerSandbox: boolean;
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
  return apiFetch<any>("/db/public");
}

export async function updateCMS(data: {
  homepage?: any;
  story?: any;
  legal?: any;
  navigation?: any[];
  brand?: any;
  features?: any;
  collections?: any;
  api_settings?: any;
  vrix_plus?: any;
}) {
  return apiFetch<any>("/cms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchProducts() {
  return apiFetch<any[]>("/products");
}

export async function fetchProduct(id: string) {
  return apiFetch<any>(`/products/${id}`);
}

export async function validateStock(items: Array<{ id: string; title: string; quantity: number }>) {
  return apiFetch<{ success: boolean; message?: string; outOfStockItems?: any[] }>("/products/validate-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export async function createProduct(productData: any) {
  return apiFetch<any>("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id: string, productData: any) {
  return apiFetch<any>(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(id: string) {
  return apiFetch<any>(`/products/${id}`, { method: "DELETE" });
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
  return apiFetch<any>("/journal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
}

export async function updateJournalPost(id: string, postData: any) {
  return apiFetch<any>(`/journal/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
}

export async function deleteJournalPost(id: string) {
  return apiFetch<any>(`/journal/${id}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECURITY LOGS
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
//  MEDIA UPLOAD
// ══════════════════════════════════════════════════════════════════════════════

export async function uploadMedia(file: File): Promise<{ url: string; public_id: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/media/upload`, { method: "POST", body: form });
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
  const res = await fetch(`${API_BASE_URL}/media/upload-multiple`, { method: "POST", body: form });
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

export async function registerUser(payload: any) {
  return apiFetch<{ success: boolean; message: string; otp?: string }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function confirmRegistration(payload: any) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string } }>("/auth/register/confirm", {
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
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string } }>("/auth/login/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUserDirect(payload: any) {
  return apiFetch<{ success: boolean; user: { email: string; name: string; phone: string } }>("/auth/login/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function verifyTruecaller(payload?: string, signature?: string, signatureAlgorithm?: string) {
  return apiFetch<{
    success: boolean;
    verified: boolean;
    profile: { name: string; email: string; phone: string };
    mode: "sandbox" | "live";
  }>("/truecaller/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, signature, signatureAlgorithm }),
  });
}

export async function loginWithGoogle(payload: { credential?: string; email?: string; name?: string; picture?: string }) {
  return apiFetch<{
    success: boolean;
    user: { email: string; name: string; phone: string; isVrixPlusMember?: boolean; vrixPlusJoinedDate?: string | null };
  }>("/auth/google", {
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
  notes?: any;
  customerName?: string;
  customerPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}) {
  return apiFetch<{ success: boolean; order: any; devMode?: boolean }>("/payment/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchPaymentConfig() {
  return apiFetch<{
    keyId: string | null;
    currency: string;
    enabled: boolean;
    devMode: boolean;
    source: "cms" | "env" | "dev";
  }>("/payment/config");
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items?: any[];
  promoCode?: string;
}) {
  return apiFetch<{ success: boolean; paymentId: string }>("/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchPaymentLogs() {
  return apiFetch<any[]>("/payment/logs");
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
  return apiFetch<any>(`/products/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock }),
  });
}

export async function updateProductVisibility(id: string, isVisible: boolean) {
  return apiFetch<any>(`/products/${id}/visibility`, {
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
  return apiFetch<any>("/collections", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collections }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — SITE CONFIG (features, brand, navigation, homepage, etc.)
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSiteConfig() {
  return apiFetch<Record<string, any>>("/config");
}

export async function saveSiteConfigKey(key: string, value: any) {
  return apiFetch<any>(`/config/${key}`, {
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
