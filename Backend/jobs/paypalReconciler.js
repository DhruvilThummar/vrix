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
        const capture = orderDetails.purchase_units?.[0]?.payments?.captures?.[0];
        const captureId = capture?.id;

        await db.$transaction(async (tx) => {
          await tx.payments.update({
            where: { id: payment.id },
            data: { status: "SUCCESS", paymentId: captureId || payment.paymentId },
          });

          await tx.securityLogs.create({
            data: {
              event: "PAYPAL_RECONCILER_AUTO_HEALED",
              user: payment.orderId,
              status: "SUCCESS",
            },
          });
        });

        console.log(`[PayPal Reconciler] Auto-healed order ${payment.orderId} to SUCCESS`);
      }
    }
  } catch (err) {
    console.error("[PayPal Reconciler Error]:", err.message);
  }
}

// Schedule node-cron job to run every 15 minutes: "*/15 * * * *"
export function initPayPalReconcilerCron() {
  console.log("⏰ Initializing PayPal Reconciler Cron Job (Runs every 15 mins)...");
  cron.schedule("*/15 * * * *", async () => {
    console.log("🔍 [Cron] Running PayPal Pending Orders Reconciliation...");
    await reconcilePendingPayPalOrders();
  });
}
