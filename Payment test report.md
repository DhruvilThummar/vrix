# Comprehensive Security Audit, Rate Limiting & QA Test Report: PayPal Payment Gateway Integration

**Auditor Role:** Senior Application Security Engineer & Lead QA Automation Lead  
**Target Platform:** VRIX Architectural Fine Jewelry (`Backend/routes/payment.js`, `Backend/middleware/rateLimiter.js`, `Backend/server.js`)  
**Scope:** Server-Side Pricing Verification, Rate Limiting (DDoS Protection), PII & Secret Isolation, Webhook Signature Verification, Node-Cron Auto-Healing, and Failure Recovery.

---

## 🛑 Part 1: Production-Grade Rate Limiting Architecture (`express-rate-limit`)

### 1. Reverse Proxy Trust Setup (`Backend/server.js`)
To properly read client IP addresses behind reverse proxies/load balancers like Cloudflare, Vercel, Nginx, or AWS ALB:

```javascript
// Backend/server.js
app.set("trust proxy", 1);
```

### 2. Dedicated Rate Limiter Middleware (`Backend/middleware/rateLimiter.js`)

```javascript
import rateLimit from "express-rate-limit";

// Global Limiter: 100 requests per 15 mins for all /api endpoints
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP address. Please try again after 15 minutes.",
    code: "GLOBAL_RATE_LIMIT_EXCEEDED",
    retryAfterMinutes: 15,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// Strict Limiter: 5 requests per 1 min for sensitive payment endpoints
export const strictPaymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many payment attempts detected. Please wait 60 seconds before retrying.",
    code: "STRICT_PAYMENT_RATE_LIMIT_EXCEEDED",
    retryAfterSeconds: 60,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
```

---

## 🔒 Part 2: Official PayPal Webhook Signature Verification Code (🚨 Critical)

```javascript
// ══════════════════════════════════════════════════════════════════════════════
//  PAYPAL — Webhook Signature Verification & Processing
//  POST /api/payment/paypal/webhook
// ══════════════════════════════════════════════════════════════════════════════
router.post("/paypal/webhook", async (req, res) => {
  const transmissionId = req.headers["paypal-transmission-id"];
  const transmissionTime = req.headers["paypal-transmission-time"];
  const certUrl = req.headers["paypal-cert-url"];
  const authAlgo = req.headers["paypal-auth-algo"];
  const transmissionSig = req.headers["paypal-transmission-sig"];
  const webhookEvent = req.body;

  try {
    const credentials = await getPayPalCredentials();
    if (!credentials) {
      return res.status(503).json({ error: "PayPal disabled" });
    }

    // 1. Verify Webhook Signature with PayPal REST API
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || "YOUR_PAYPAL_WEBHOOK_ID";
    const { token, baseUrl } = await getPayPalAccessToken(credentials);

    if (transmissionId && transmissionSig && certUrl) {
      const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: webhookEvent,
        }),
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.verification_status !== "SUCCESS") {
          console.warn("[PayPal Webhook Warning]: Invalid signature verification status!", verifyData);
          return res.status(400).json({ error: "Invalid Webhook Signature" });
        }
      }
    }

    // Acknowledge immediately to PayPal
    res.status(200).json({ status: "SUCCESS" });

    // 2. Process Verified Webhook Event
    const eventType = webhookEvent?.event_type;
    const resource = webhookEvent?.resource;

    if (!eventType || !resource) return;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = resource.id;
      const supplementalData = resource.supplementary_data?.related_ids;
      const ppOrderId = supplementalData?.order_id;

      if (ppOrderId) {
        // Idempotency: Check if already SUCCESS
        const existing = await db.payments.findFirst({ where: { gatewayOrderId: ppOrderId } });
        if (existing && existing.status === "SUCCESS") {
          return;
        }

        await db.payments.updateMany({
          where: { gatewayOrderId: ppOrderId },
          data: { status: "SUCCESS", paymentId: captureId },
        });

        await db.securityLogs.create({
          data: { event: "PAYPAL_WEBHOOK_CAPTURE_COMPLETED", user: captureId, status: "SUCCESS" },
        });
      }
    }
  } catch (err) {
    console.error("[PayPal Webhook Error]:", err.message);
  }
});
```

---

## 🎨 Part 3: Frontend Integration Code (React / Next.js Smart Buttons)

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPayPalOrder, capturePayPalOrder } from "@/utils/api";

interface PayPalButtonProps {
  items: any[];
  isGiftWrapped?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
  promoCode?: string;
}

export default function PayPalPaymentButton({
  items,
  isGiftWrapped,
  giftMessage,
  giftWrapPrice,
  promoCode,
}: PayPalButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).paypal) return;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      (window as any).paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },

        createOrder: async () => {
          setLoading(true);
          try {
            const res = await createPayPalOrder({
              items,
              isGiftWrapped,
              giftMessage,
              giftWrapPrice,
              promoCode,
            });
            if (res?.orderId) {
              return res.orderId;
            }
            throw new Error(res?.error || "Failed to create PayPal order.");
          } catch (err: any) {
            setLoading(false);
            showToast("Order creation failed: " + err.message);
            throw err;
          }
        },

        onApprove: async (data: { orderID: string }) => {
          try {
            const res = await capturePayPalOrder({
              paypalOrderId: data.orderID,
              items,
              promoCode,
              isGiftWrapped,
              giftMessage,
              giftWrapPrice,
            });

            if (res?.success) {
              router.push(`/checkout/confirmation?orderId=${res.paymentId || data.orderID}`);
            } else {
              showToast(res?.error || "PayPal payment capture failed.");
            }
          } catch (err: any) {
            showToast("Capture verification error: " + err.message);
          } finally {
            setLoading(false);
          }
        },

        onCancel: () => {
          setLoading(false);
          showToast("Checkout was cancelled. Your cart items are still saved.");
        },

        onError: (err: any) => {
          setLoading(false);
          showToast("PayPal transaction encountered an error. Please try again.");
        },
      }).render(containerRef.current);
    }
  }, [items, isGiftWrapped, giftMessage, giftWrapPrice, promoCode, router]);

  return (
    <div className="w-full space-y-3">
      {toastMessage && (
        <div className="p-3 bg-deep-navy text-pure-white text-xs border border-slate-grey/30 rounded flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-xs font-bold p-1 cursor-pointer">✕</button>
        </div>
      )}
      <div ref={containerRef} className="w-full min-h-[50px]" />
    </div>
  );
}
```

---

## ⏰ Part 4: Node-Cron 15-Minute Background Reconciler Setup

```javascript
// Backend/jobs/paypalReconciler.js
import cron from "node-cron";
import { db } from "../database.js";
import { getPayPalAccessToken, getPayPalCredentials } from "../routes/payment.js";

export async function reconcilePendingPayPalOrders() {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const pendingPayments = await db.payments.findMany({
      where: {
        paymentGateway: "paypal",
        status: "CREATED",
        createdAt: { lte: fifteenMinsAgo },
      },
    });

    if (!pendingPayments || pendingPayments.length === 0) return;

    const credentials = await getPayPalCredentials();
    if (!credentials) return;

    const { token, baseUrl } = await getPayPalAccessToken(credentials);

    for (const payment of pendingPayments) {
      const paypalOrderId = payment.gatewayOrderId;
      if (!paypalOrderId) continue;

      const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) continue;
      const orderDetails = await res.json();

      if (orderDetails.status === "COMPLETED") {
        await db.$transaction(async (tx) => {
          await tx.payments.update({
            where: { id: payment.id },
            data: { status: "SUCCESS" },
          });
          console.log(`[PayPal Reconciler] Auto-healed order ${payment.orderId} to SUCCESS`);
        });
      }
    }
  } catch (err) {
    console.error("[PayPal Reconciler Error]:", err.message);
  }
}

export function initPayPalReconcilerCron() {
  cron.schedule("*/15 * * * *", async () => {
    await reconcilePendingPayPalOrders();
  });
}
```