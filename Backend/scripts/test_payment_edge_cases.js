process.env.NODE_ENV = "test";
process.env.TEST_MODE = "true";

import "dotenv/config";
import http from "http";
import { PrismaClient } from "@prisma/client";

const { default: app } = await import("../server.js");
const prisma = new PrismaClient();

const testSuite = [];

function logTest(testName, passed, durationMs, details = "") {
  testSuite.push({
    "Test Scenario": testName,
    Status: passed ? "✅ PASS" : "❌ FAIL",
    "Time": `${durationMs}ms`,
    Details: details,
  });
  console.log(`[${passed ? "PASS" : "FAIL"}] (${durationMs}ms) ${testName} ${details ? "-> " + details : ""}`);
}

async function runPaymentEdgeCaseSuite() {
  console.log("=====================================================================");
  console.log("   VRIX REAL-WORLD CUSTOMER PAYMENT & EDGE-CASE TEST SUITE           ");
  console.log("   (Double-Click, Network Dropped, Concurrency, Tampering & Stock)   ");
  console.log("=====================================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Edge-Case Test Server running on: ${baseUrl}\n`);

  const auditCustomer = `edge_audit_${Date.now()}@vrixjewels.com`;

  // Fetch a sample product from DB
  const sampleProduct = await prisma.product.findFirst({
    where: { isVisible: true, stock: { gte: 10 } },
  });

  if (!sampleProduct) {
    console.error("❌ No visible product with stock >= 10 found for testing.");
    server.close();
    await prisma.$disconnect();
    return;
  }

  const initialStock = sampleProduct.stock;
  console.log(`📦 Using test product: "${sampleProduct.title}" (ID: ${sampleProduct.id}, Stock: ${initialStock})\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: ZERO / NEGATIVE PRICE TAMPERING DEFENSE
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -1500, currency: "INR" }),
      });
      const passed = res.status === 400;
      logTest("1. Negative Amount Tamper Check (amount: -1500)", passed, Date.now() - t0, `Status: ${res.status}`);
    }

    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 0, currency: "INR" }),
      });
      const passed = res.status === 400;
      logTest("2. Zero Amount Tamper Check (amount: 0)", passed, Date.now() - t0, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: PRE-CHECKOUT OUT-OF-STOCK DEFENSE (CART VALIDATION)
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/products/validate-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: sampleProduct.id, title: sampleProduct.title, quantity: 999999 }],
        }),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.success === false && Array.isArray(data.outOfStockItems);
      logTest("3. Pre-checkout Stock Depletion Block (Requested > Available)", passed, Date.now() - t0, `Rejected: ${data.outOfStockItems?.[0]?.reason}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: VALID ORDER CREATION (BASE ORDER)
    // -------------------------------------------------------------------------
    let createdOrderId = null;
    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 25000,
          currency: "INR",
          email: auditCustomer,
          customerName: "Edge Tester",
          customerPhone: "+919876543210",
          address: "10 Luxury Tower",
          city: "Mumbai",
          postalCode: "400001",
        }),
      });
      const data = await res.json();
      createdOrderId = data?.order?.id;
      const passed = res.status === 200 && !!createdOrderId;
      logTest("4. Order Creation Under Normal Conditions", passed, Date.now() - t0, `Order: ${createdOrderId}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: FRAUDULENT / TAMPERED SIGNATURE (HACK ATTEMPT)
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: createdOrderId,
          razorpay_payment_id: "pay_fake_hacker_id",
          razorpay_signature: "tampered_fake_signature_999",
          items: [{ id: sampleProduct.id, quantity: 1 }],
        }),
      });
      const data = await res.json();
      // Should reject and mark payment as FAILED
      const dbPayment = await prisma.payment.findUnique({ where: { orderId: createdOrderId } });
      const passed = res.status === 400 && dbPayment?.status === "FAILED";
      logTest("5. Fake Signature Tampering Defense", passed, Date.now() - t0, `Status: ${res.status}, DB Payment: ${dbPayment?.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: MISSING NETWORK PACKET / DROPPED MANDATORY FIELDS
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: createdOrderId,
          // Missing razorpay_payment_id & razorpay_signature
        }),
      });
      const passed = res.status === 400;
      logTest("6. Malformed Packet / Missing Signature Reject", passed, Date.now() - t0, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: LEGITIMATE PAYMENT VERIFICATION & STOCK ATOMIC DEDUCTION
    // -------------------------------------------------------------------------
    // Reset payment back to CREATED for testing
    await prisma.payment.update({ where: { orderId: createdOrderId }, data: { status: "CREATED" } });

    {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: createdOrderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "dev_signature",
          items: [{ id: sampleProduct.id, quantity: 1 }],
        }),
      });
      const data = await res.json();
      const freshProduct = await prisma.product.findUnique({ where: { id: sampleProduct.id } });
      const passed = res.status === 200 && freshProduct.stock === initialStock - 1;
      logTest("7. Legitimate Payment Verification & Atomic Stock -1", passed, Date.now() - t0, `Stock reduced: ${initialStock} -> ${freshProduct.stock}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: DOUBLE-CLICK / REPLAY ATTACK IDEMPOTENCY TEST
    // -------------------------------------------------------------------------
    // Simulate user frantically double clicking "Pay Now" or network retrying
    {
      const t0 = Date.now();
      const stockBeforeSecondClick = (await prisma.product.findUnique({ where: { id: sampleProduct.id } })).stock;

      const res = await fetch(`${baseUrl}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: createdOrderId, // ALREADY SUCCESSFUL
          razorpay_payment_id: `pay_test_duplicate_click`,
          razorpay_signature: "dev_signature",
          items: [{ id: sampleProduct.id, quantity: 1 }],
        }),
      });
      const data = await res.json();
      const stockAfterSecondClick = (await prisma.product.findUnique({ where: { id: sampleProduct.id } })).stock;

      // Idempotency rule: stock must NOT be deducted again!
      const passed = res.status === 200 && data.isDuplicate === true && stockBeforeSecondClick === stockAfterSecondClick;
      logTest("8. User Double-Click / Duplicate Verify Defense", passed, Date.now() - t0, `Duplicate Caught: ${data.isDuplicate}, Stock unchanged: ${stockAfterSecondClick}`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: CONCURRENT "RACE CONDITION" ON LAST ITEM IN STOCK
    // -------------------------------------------------------------------------
    // Two users click "Pay" at the exact same millisecond when only 1 item remains!
    {
      const t0 = Date.now();
      // Set test product stock to 1
      await prisma.product.update({ where: { id: sampleProduct.id }, data: { stock: 1 } });

      // Create 2 separate orders
      const [orderA, orderB] = await Promise.all([
        prisma.payment.create({
          data: { orderId: `order_dev_race_A_${Date.now()}`, amount: 10000, status: "CREATED", userEmail: "userA@vrix.com" }
        }),
        prisma.payment.create({
          data: { orderId: `order_dev_race_B_${Date.now()}`, amount: 10000, status: "CREATED", userEmail: "userB@vrix.com" }
        })
      ]);

      // Fire both payment verifications in parallel
      const [resA, resB] = await Promise.all([
        fetch(`${baseUrl}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderA.orderId,
            razorpay_payment_id: "pay_race_A",
            razorpay_signature: "dev_signature",
            items: [{ id: sampleProduct.id, quantity: 1 }],
          }),
        }),
        fetch(`${baseUrl}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderB.orderId,
            razorpay_payment_id: "pay_race_B",
            razorpay_signature: "dev_signature",
            items: [{ id: sampleProduct.id, quantity: 1 }],
          }),
        })
      ]);

      const finalProduct = await prisma.product.findUnique({ where: { id: sampleProduct.id } });
      const successfulCount = (resA.status === 200 ? 1 : 0) + (resB.status === 200 ? 1 : 0);

      // Exactly ONE must succeed, stock must be 0 (NEVER negative!), and one must fail
      const passed = successfulCount === 1 && finalProduct.stock === 0;
      logTest("9. Race Condition Concurrency Test (2 buyers, 1 item)", passed, Date.now() - t0, `Won: ${successfulCount}/2, Final Stock: ${finalProduct.stock} (Never Negative)`);

      // Cleanup race orders
      await prisma.payment.deleteMany({
        where: { orderId: { in: [orderA.orderId, orderB.orderId] } }
      }).catch(() => {});
    }

    // -------------------------------------------------------------------------
    // TEST 9: RELATIONAL ORDER ITEM CASCADING SAFETY
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now();
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: createdOrderId,
          productId: sampleProduct.id,
          title: sampleProduct.title,
          price: 25000,
          quantity: 1,
        }
      });

      // Cascade delete order
      await prisma.payment.delete({ where: { orderId: createdOrderId } });
      const leftoverItems = await prisma.orderItem.findMany({ where: { orderId: createdOrderId } });
      const passed = !!orderItem && leftoverItems.length === 0;
      logTest("10. Relational Integrity & Cascade Cleanup", passed, Date.now() - t0, `Items auto-cleaned: ${leftoverItems.length}`);
    }

    // Restore original product stock
    await prisma.product.update({ where: { id: sampleProduct.id }, data: { stock: initialStock } });
    console.log(`\n🔄 Restored product "${sampleProduct.title}" stock to initial: ${initialStock}`);

  } catch (err) {
    console.error("Test execution encountered an error:", err);
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT TABLE
  // ---------------------------------------------------------------------------
  console.log("\n=====================================================================");
  console.log("            PAYMENT EDGE-CASE AUDIT SUMMARY REPORT                  ");
  console.log("=====================================================================");
  console.table(testSuite);

  const passed = testSuite.filter((t) => t.Status.includes("PASS")).length;
  const failed = testSuite.filter((t) => t.Status.includes("FAIL")).length;

  console.log(`\nTotal Scenarios Tested : ${testSuite.length}`);
  console.log(`Passed                 : ${passed} ✅`);
  console.log(`Failed                 : ${failed} ${failed === 0 ? "🎉" : "❌"}`);

  if (failed === 0) {
    console.log("\n🛡️ VERDICT: PAYMENT ENGINE IS BULLETPROOF AGAINST DOUBLE-CLICKS, NETWORK DROPS, & RACE CONDITIONS!");
  }
}

runPaymentEdgeCaseSuite();
