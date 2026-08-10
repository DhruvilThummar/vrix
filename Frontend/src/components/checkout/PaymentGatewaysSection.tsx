"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  fetchPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  createPayPalOrder,
  capturePayPalOrder,
  validateStock,
  PaymentConfigResponse,
} from "@/utils/api";

interface PaymentGatewaysSectionProps {
  grandTotal: number;
  promoCode?: string;
  currency: string;
  shipping: {
    fullName: string;
    email: string;
    phone?: string | null;
    address: string;
    apartment?: string | null;
    city: string;
    postalCode: string;
  };
  items: any[];
  isGiftWrapped?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
  formatPrice: (amount: number) => string;
  formatPriceRaw: (amount: number) => number;
  onSuccess: (orderId: string, paymentId: string) => void;
}

export default function PaymentGatewaysSection({
  grandTotal,
  promoCode,
  currency,
  shipping,
  items,
  isGiftWrapped = false,
  giftMessage = "",
  giftWrapPrice = 0,
  formatPrice,
  formatPriceRaw,
  onSuccess,
}: PaymentGatewaysSectionProps) {
  const [config, setConfig] = useState<PaymentConfigResponse | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"paypal" | "razorpay">("paypal");
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "verifying" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [rzpSdkReady, setRzpSdkReady] = useState(false);
  const [paypalSdkReady, setPaypalSdkReady] = useState(false);

  // PayPal buttons rendering ref
  const paypalButtonContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsInstanceRef = useRef<any>(null);

  // Load gateway configurations
  useEffect(() => {
    fetchPaymentConfig()
      .then((cfg) => {
        console.log("[Payment Config Loaded]", cfg);
        setConfig(cfg);
        // Default to PayPal unless PayPal is disabled and Razorpay is enabled
        if (cfg.paypal?.enabled) {
          setSelectedGateway("paypal");
        } else if (cfg.razorpay?.enabled) {
          setSelectedGateway("razorpay");
        }
      })
      .catch((err) => {
        console.error("Failed to load payment config", err);
        // Fallback default dev state
        setConfig({
          razorpay: { enabled: false, devMode: true, source: "dev" },
          paypal: { enabled: true, devMode: true, source: "dev" },
          currency: "INR",
          keyId: null,
          enabled: false,
          devMode: true,
          source: "dev",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Dynamically load Razorpay SDK if selected
  useEffect(() => {
    if (selectedGateway !== "razorpay" || !config?.razorpay) return;

    if ((window as any).Razorpay) {
      setRzpSdkReady(true);
      return;
    }

    const scriptId = "razorpay-sdk-checkout";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.head.appendChild(script);
    }

    script.onload = () => setRzpSdkReady(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      setErrorMsg("Could not load Razorpay SDK. Please check your network.");
    };
  }, [selectedGateway, config]);

  // Dynamically load PayPal SDK if selected and active
  useEffect(() => {
    if (selectedGateway !== "paypal" || !config?.paypal) return;

    const ppConfig = config.paypal;
    // If running in Dev Simulation mode (no PayPal Client ID set), skip loading PayPal official SDK
    if (!ppConfig.clientId || ppConfig.clientId === "YOUR_PAYPAL_CLIENT_ID") {
      setPaypalSdkReady(false);
      return;
    }

    // Clean up any existing rendered buttons first to avoid duplicate renders
    if (paypalButtonsInstanceRef.current) {
      try {
        paypalButtonsInstanceRef.current.close();
      } catch (e) {
        // ignore
      }
      paypalButtonsInstanceRef.current = null;
    }

    const loadPaypalScript = () => {
      // Normalize currency (PayPal doesn't support INR, convert dynamically to USD for sandbox/live checkout)
      const targetCurrency = currency === "INR" ? "USD" : currency;
      const scriptId = `paypal-sdk-script-${targetCurrency}`;

      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://www.paypal.com/sdk/js?client-id=${ppConfig.clientId}&currency=${targetCurrency}&intent=capture&commit=true`;
        script.async = true;
        document.head.appendChild(script);
      }

      const initButtons = () => {
        setPaypalSdkReady(true);
        if (paypalButtonContainerRef.current && (window as any).paypal) {
          paypalButtonContainerRef.current.innerHTML = ""; // clear
          try {
            paypalButtonsInstanceRef.current = (window as any).paypal.Buttons({
              createOrder: async () => {
                setPaymentStatus("processing");
                setErrorMsg("");
                try {
                  await validateStock(
                    items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity }))
                  );
                  // Convert INR to USD value if needed
                  const convertedAmount = currency === "INR" ? grandTotal / 80 : grandTotal;
                  const res = await createPayPalOrder({
                    amount: convertedAmount,
                    currency: targetCurrency,
                    customerName: shipping.fullName,
                    customerPhone: shipping.phone || undefined,
                    email: shipping.email,
                    address: shipping.apartment
                      ? `${shipping.address}, ${shipping.apartment}`
                      : shipping.address,
                    city: shipping.city,
                    postalCode: shipping.postalCode,
                    isGiftWrapped,
                    giftMessage,
                    giftWrapPrice,
                  });

                  if (!res.success || !res.orderId) {
                    throw new Error("Failed to create PayPal order.");
                  }
                  return res.orderId;
                } catch (err: any) {
                  setPaymentStatus("error");
                  setErrorMsg(err.message || "Failed to create payment order.");
                  throw err;
                }
              },
              onApprove: async (data: any) => {
                setPaymentStatus("verifying");
                try {
                  const res = await capturePayPalOrder({
                    paypalOrderId: data.orderID,
                    items,
                    promoCode,
                    isGiftWrapped,
                    giftMessage,
                    giftWrapPrice,
                    email: shipping.email,
                  });

                  if (res.success) {
                    setPaymentStatus("success");
                    onSuccess(res.orderId, res.paymentId);
                  } else {
                    throw new Error("Capture failed");
                  }
                } catch (err: any) {
                  setPaymentStatus("error");
                  setErrorMsg(err.message || "PayPal capture verification failed.");
                }
              },
              onError: (err: any) => {
                console.error("PayPal Error Callback:", err);
                setPaymentStatus("error");
                setErrorMsg("PayPal transaction was declined or failed. Please try again.");
              },
              onCancel: () => {
                setPaymentStatus("idle");
              },
              style: {
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "pay",
              },
            });
            paypalButtonsInstanceRef.current.render(paypalButtonContainerRef.current);
          } catch (e) {
            console.error("Error rendering PayPal buttons:", e);
          }
        }
      };

      if ((window as any).paypal) {
        initButtons();
      } else {
        script.onload = initButtons;
        script.onerror = () => {
          console.error("Failed to load PayPal JS SDK");
          setErrorMsg("Could not load PayPal payment script. Check network connection.");
        };
      }
    };

    loadPaypalScript();

    return () => {
      // Cleanup buttons instance
      if (paypalButtonsInstanceRef.current) {
        try {
          paypalButtonsInstanceRef.current.close();
        } catch (e) {}
      }
    };
  }, [selectedGateway, config, currency, grandTotal, items, shipping, promoCode, isGiftWrapped, giftMessage, giftWrapPrice]);

  // Razorpay Checkout Handler
  const handleRazorpayPay = async () => {
    if (!config?.razorpay) return;
    setPaymentStatus("processing");
    setErrorMsg("");

    try {
      await validateStock(
        items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity }))
      );

      // Create internal Razorpay order
      const orderRes = await createPaymentOrder({
        amount: formatPriceRaw(grandTotal),
        currency,
        receipt: `vrix_${Date.now()}`,
        customerName: shipping.fullName,
        customerPhone: shipping.phone || undefined,
        email: shipping.email,
        address: shipping.apartment
          ? `${shipping.address}, ${shipping.apartment}`
          : shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
      });

      const { order, devMode, keyId } = orderRes;

      // Dev Mode fallback check
      if (devMode || !keyId) {
        setPaymentStatus("verifying");
        const fakePaymentId = `pay_dev_${Date.now()}`;
        await verifyPayment({
          razorpay_order_id: order.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: "dev_signature",
          items,
          promoCode,
          isGiftWrapped,
          giftMessage,
          giftWrapPrice,
        });

        setPaymentStatus("success");
        onSuccess(order.id, fakePaymentId);
        return;
      }

      // Strict SDK & key check
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK is not ready yet. Please check your internet connection.");
      }

      setPaymentStatus("idle");

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "VRIX",
        description: `Order ${order.id}`,
        image: "/logos/black.png",
        order_id: order.id,
        prefill: {
          name: shipping.fullName,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: { color: "#0f1728" },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
          },
        },
        handler: async (response: any) => {
          setPaymentStatus("verifying");
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items,
              promoCode,
              isGiftWrapped,
              giftMessage,
              giftWrapPrice,
            });

            setPaymentStatus("success");
            onSuccess(response.razorpay_order_id, response.razorpay_payment_id);
          } catch (err: any) {
            setPaymentStatus("error");
            setErrorMsg(
              err.message ||
                `Verification failed. Contact support with Order ID: ${response.razorpay_order_id}`
            );
          }
        },
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      setPaymentStatus("error");
      setErrorMsg(err.message || "Failed to launch Razorpay. Try again.");
    }
  };

  // PayPal Dev Simulator Handler
  const handlePaypalDevSimulate = async () => {
    setPaymentStatus("processing");
    setErrorMsg("");

    try {
      await validateStock(
        items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity }))
      );

      // Create PayPal order in Sandbox mode
      // Convert currency to USD if INR for PayPal compatibility
      const targetCurrency = currency === "INR" ? "USD" : currency;
      const convertedAmount = currency === "INR" ? grandTotal / 80 : grandTotal;

      const orderRes = await createPayPalOrder({
        amount: convertedAmount,
        currency: targetCurrency,
        customerName: shipping.fullName,
        customerPhone: shipping.phone || undefined,
        email: shipping.email,
        address: shipping.apartment
          ? `${shipping.address}, ${shipping.apartment}`
          : shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        isGiftWrapped,
        giftMessage,
        giftWrapPrice,
      });

      if (!orderRes.success || !orderRes.orderId) {
        throw new Error("Unable to create PayPal order.");
      }

      setPaymentStatus("verifying");

      // Verify and capture
      const captureRes = await capturePayPalOrder({
        paypalOrderId: orderRes.orderId,
        items,
        promoCode,
        isGiftWrapped,
        giftMessage,
        giftWrapPrice,
        email: shipping.email,
      });

      if (captureRes.success) {
        setPaymentStatus("success");
        onSuccess(captureRes.orderId, captureRes.paymentId);
      } else {
        throw new Error("Sandbox capture simulation failed.");
      }
    } catch (err: any) {
      console.error(err);
      setPaymentStatus("error");
      setErrorMsg(err.message || "PayPal Sandbox Simulator failed.");
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-grey/20 p-6 bg-soft-linen/30 text-center animate-pulse">
        <span className="w-6 h-6 border-2 border-deep-navy border-t-transparent rounded-full animate-spin inline-block mb-2" />
        <p className="font-label-caps text-xs text-deep-navy tracking-widest">Loading Gateway Options…</p>
      </div>
    );
  }

  // Gateways status checks
  const isPaypalActive = config?.paypal?.enabled ?? false;
  const isRazorpayActive = config?.razorpay?.enabled ?? false;

  // Render Unavailable message if both are OFF
  if (!isPaypalActive && !isRazorpayActive) {
    return (
      <div className="border border-slate-grey/20 p-8 space-y-4 bg-soft-linen/30 text-center">
        <span className="material-symbols-outlined text-slate-grey text-4xl">credit_card_off</span>
        <h3 className="font-label-caps text-sm text-deep-navy font-bold uppercase tracking-wider">
          All Payment Gateways Unavailable
        </h3>
        <p className="text-xs text-slate-grey font-body-md max-w-md mx-auto">
          Online checkouts are currently disabled by the administrator. Please contact our support team to place a manual order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Selector Tabs */}
      <div className="flex border border-slate-grey/25 bg-surface-container-low/40 p-1">
        {isPaypalActive && (
          <button
            onClick={() => {
              setSelectedGateway("paypal");
              setErrorMsg("");
              setPaymentStatus("idle");
            }}
            className={`flex-1 py-3.5 text-center font-label-caps text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedGateway === "paypal"
                ? "bg-deep-navy text-pure-white shadow-sm"
                : "text-slate-grey hover:text-ink-black"
            }`}
          >
            PayPal / Cards (Default)
          </button>
        )}
        {isRazorpayActive && (
          <button
            onClick={() => {
              setSelectedGateway("razorpay");
              setErrorMsg("");
              setPaymentStatus("idle");
            }}
            className={`flex-1 py-3.5 text-center font-label-caps text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedGateway === "razorpay"
                ? "bg-deep-navy text-pure-white shadow-sm"
                : "text-slate-grey hover:text-ink-black"
            }`}
          >
            UPI &amp; Local Cards
          </button>
        )}
      </div>

      {/* Gateway Panel Card */}
      <div className="border border-slate-grey/20 p-6 space-y-6 bg-pure-white">
        {selectedGateway === "paypal" ? (
          <>
            {/* PayPal Gateway Description */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-deep-navy flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-pure-white text-[16px]">security</span>
              </div>
              <div>
                <p className="font-body-md text-sm font-semibold text-ink-black">Secure Checkout via PayPal</p>
                <p className="text-[10px] text-slate-grey font-body-md">Pay with PayPal Account, Credit or Debit Card</p>
              </div>
              <img
                src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_v3_mktg_logo_180x35.png"
                alt="PayPal"
                className="h-6 ml-auto opacity-70 object-contain max-w-[120px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Currency Note for PayPal India */}
            {currency === "INR" && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed font-body-md">
                💡 PayPal does not process INR transactions directly. The total will be billed in USD value of approximately{" "}
                <strong>${(grandTotal / 80).toFixed(2)} USD</strong>.
              </div>
            )}

            {/* PayPal SDK Buttons Render Box */}
            {config?.paypal?.clientId && config.paypal.clientId !== "YOUR_PAYPAL_CLIENT_ID" ? (
              <div className="space-y-4">
                <div ref={paypalButtonContainerRef} className="w-full min-h-[50px] relative z-10" />
              </div>
            ) : (
              // PayPal Dev/Simulation Button (no clientId)
              <div className="space-y-4">
                <div className="border border-amber-300 bg-amber-50/40 p-4 text-center space-y-2">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">construction</span>
                  <p className="font-label-caps text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                    PayPal Sandbox Simulator Mode
                  </p>
                  <p className="text-xs text-slate-grey font-body-md max-w-sm mx-auto">
                    Admin keys are not configured. Launch sandbox simulation to test full order fulfillment.
                  </p>
                </div>
                {paymentStatus === "idle" && (
                  <button
                    onClick={handlePaypalDevSimulate}
                    className="w-full bg-amber-500 text-pure-white py-4.5 font-button uppercase tracking-widest hover:bg-amber-600 transition-colors cursor-pointer flex items-center justify-center gap-3 text-sm shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Pay via PayPal Simulator
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          // Razorpay gateway
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-deep-navy flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-pure-white text-[16px]">lock</span>
              </div>
              <div>
                <p className="font-body-md text-sm font-semibold text-ink-black">Secure Payment via Razorpay</p>
                <p className="text-[10px] text-slate-grey font-body-md">UPI, local Cards, Net Banking, and Wallets</p>
              </div>
              <img
                src="https://razorpay.com/assets/razorpay-glyph.svg"
                alt="Razorpay"
                className="h-6 ml-auto opacity-60"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Payment method icons */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "credit_card", label: "Cards" },
                { icon: "account_balance", label: "Net Banking" },
                { icon: "qr_code_2", label: "UPI" },
                { icon: "account_balance_wallet", label: "Wallets" },
              ].map((m) => (
                <div key={m.label} className="border border-slate-grey/20 p-3 flex flex-col items-center gap-1.5 bg-soft-linen/30">
                  <span className="material-symbols-outlined text-slate-grey text-[20px]">{m.icon}</span>
                  <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{m.label}</span>
                </div>
              ))}
            </div>

            {paymentStatus === "idle" && (
              <button
                onClick={handleRazorpayPay}
                className="w-full bg-deep-navy text-pure-white py-5 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-3 text-base shadow-md"
              >
                Pay Now with Razorpay
              </button>
            )}
          </>
        )}

        {/* Unified Amount To Pay Footer */}
        <div className="bg-deep-navy/5 border border-deep-navy/15 p-4 flex justify-between items-center">
          <div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">Amount to Pay</p>
            <p className="font-headline-md text-2xl text-deep-navy font-bold mt-1">{formatPrice(grandTotal)}</p>
          </div>
          {promoCode && (
            <div className="text-right">
              <p className="text-[9px] text-slate-grey font-label-caps uppercase tracking-widest">Code Applied</p>
              <p className="text-sm text-green-700 font-body-md font-semibold">{promoCode}</p>
            </div>
          )}
        </div>

        {/* Dynamic Status Badges / Modals */}
        {paymentStatus === "processing" && (
          <div className="flex items-center gap-3 text-slate-grey font-body-md text-sm p-3 bg-slate-50 border border-slate-200">
            <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />
            Creating secure transaction session…
          </div>
        )}
        {paymentStatus === "verifying" && (
          <div className="flex items-center gap-3 text-deep-navy font-body-md text-sm p-3 bg-deep-navy/5 border border-deep-navy/20">
            <span className="w-4 h-4 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
            Capturing and verifying transaction…
          </div>
        )}
        {paymentStatus === "success" && (
          <div className="flex items-center gap-3 text-green-700 font-body-md text-sm p-3 bg-green-50 border border-green-200">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Payment verified successfully! Redirecting to confirmation page…
          </div>
        )}
        {paymentStatus === "error" && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm space-y-2">
            <p className="text-red-700 text-sm font-body-md flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
              {errorMsg}
            </p>
            <button
              onClick={() => {
                setPaymentStatus("idle");
                setErrorMsg("");
              }}
              className="text-[10px] font-label-caps uppercase tracking-widest text-red-600 hover:underline cursor-pointer"
            >
              Dismiss &amp; Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
