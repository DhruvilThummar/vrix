"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { fetchDb, verifyTruecaller } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { subtotal, discount, promoType } = useCart();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
    }
  }, [isLoggedIn, router]);

  const [truecallerEnabled, setTruecallerEnabled] = useState(false);
  const [truecallerSandbox, setTruecallerSandbox] = useState(true);
  const [showTruecallerModal, setShowTruecallerModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom mock profile states
  const [simName, setSimName] = useState("Dhruv Agent");
  const [simPhone, setSimPhone] = useState("+919876543210");
  const [simEmail, setSimEmail] = useState("dhruv@vrix.com");

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.api_settings) {
          setTruecallerEnabled(!!res.api_settings.truecallerEnabled);
          setTruecallerSandbox(!!res.api_settings.truecallerSandboxMode);
        }
      })
      .catch((err) => console.error("Failed to load API settings for Truecaller:", err));
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTruecallerVerification = async () => {
    if (truecallerSandbox) {
      setShowTruecallerModal(true);
    } else {
      triggerToast("Initiating live Truecaller verification...");
      alert("Live Truecaller verification requires HTTPS and an App registration. Please toggle 'Sandbox Simulator Mode' in the Admin panel to test locally.");
    }
  };

  const handleAutofillConfirm = async () => {
    setVerifyLoading(true);
    try {
      const rawPayload = {
        firstName: simName.split(" ")[0] || "",
        lastName: simName.split(" ").slice(1).join(" ") || "",
        email: simEmail,
        phoneNumber: simPhone,
        verifier: "mock-verifier-check"
      };
      const base64Payload = btoa(JSON.stringify(rawPayload));
      
      const res = await verifyTruecaller(base64Payload, "mock-signature", "RSA-SHA512");
      
      if (res.success && res.profile) {
        const emailInput = document.getElementById("email") as HTMLInputElement;
        const nameInput = document.getElementById("full-name") as HTMLInputElement;
        const phoneInput = document.getElementById("phone") as HTMLInputElement;
        
        if (emailInput) emailInput.value = res.profile.email;
        if (nameInput) nameInput.value = res.profile.name;
        if (phoneInput) phoneInput.value = res.profile.phone;
        
        triggerToast("⚡ Profile successfully autofilled via Truecaller!");
      } else {
        triggerToast("Truecaller verification failed.");
      }
    } catch (err: any) {
      triggerToast("Verification failed: " + err.message);
    } finally {
      setVerifyLoading(false);
      setShowTruecallerModal(false);
    }
  };

  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;

  const finalSubtotal = subtotal - discountAmount;
  const shippingFee = finalSubtotal >= 150 ? 0 : 15;
  const grandTotal = finalSubtotal + shippingFee;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const email = fd.get("email") as string;
    const fullName = fd.get("full-name") as string;
    const country = fd.get("country") as string;
    const address = fd.get("address") as string;
    const apartment = fd.get("apartment") as string;
    const city = fd.get("city") as string;
    const postalCode = fd.get("postal-code") as string;
    const phone = fd.get("phone") as string;

    const shippingData = {
      email,
      fullName,
      country,
      address,
      apartment,
      city,
      postalCode,
      phone,
      grandTotal,
      currency: "INR"
    };

    sessionStorage.setItem("vrix-shipping", JSON.stringify(shippingData));
    router.push("/checkout/payment");
  };

  return (
    <div className="w-full">
      <main className="flex-grow w-full max-w-[800px] mx-auto px-margin-mobile md:px-0 py-section-gap flex flex-col">

        <nav aria-label="Progress" className="mb-stack-lg w-full">
          <ol className="flex justify-between items-center w-full border-b border-slate-grey/20 pb-4" role="list">
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-ink-black border-b border-ink-black pb-4 block w-full">1 SHIPPING</span>
            </li>
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-slate-grey pb-4 block w-full">2 PAYMENT</span>
            </li>
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-slate-grey pb-4 block w-full">3 CONFIRMATION</span>
            </li>
          </ol>
        </nav>

        <div className="w-full mt-stack-lg">
          <h1 className="font-headline-md text-headline-md mb-stack-lg uppercase text-center md:text-left">Shipping Information</h1>
          <form onSubmit={handleSubmit} className="space-y-stack-lg">

            {truecallerEnabled && (
              <div className="bg-soft-linen/30 border border-slate-grey/20 p-6 mb-stack-md flex flex-col md:flex-row justify-between items-center gap-4 hover:border-slate-grey/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-deep-navy/5 flex items-center justify-center rounded-full text-deep-navy">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-sm text-deep-navy uppercase tracking-wider">Instant Checkout Autofill</h3>
                    <p className="text-[11px] text-slate-grey font-body-md mt-0.5">Securely verify your number and populate address details using Truecaller.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTruecallerVerification}
                  className="bg-deep-navy text-pure-white py-2.5 px-5 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors flex items-center gap-2 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">bolt</span>
                  Autofill Profile
                </button>
              </div>
            )}

            <div className="space-y-stack-md">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">Contact</h2>
              <div className="relative">
                <label className="sr-only" htmlFor="email">Email address</label>
                <input autoComplete="email" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="email" name="email" placeholder="Email address" required={true} type="email" />
              </div>
            </div>

            <div className="space-y-stack-md mt-stack-lg">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="country">Country/Region</label>
                  <select autoComplete="country-name" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black focus:border-deep-navy focus:ring-0 sm:text-body-md appearance-none transition-colors duration-300" id="country" name="country">
                    <option value="india">India</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <span aria-hidden="true" className="material-symbols-outlined text-slate-grey" style={{ fontSize: "20px" }}>expand_more</span>
                  </div>
                </div>
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="full-name">Full name</label>
                  <input autoComplete="name" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="full-name" name="full-name" placeholder="Full name" required={true} type="text" />
                </div>
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="address">Address</label>
                  <input autoComplete="street-address" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="address" name="address" placeholder="Address" required={true} type="text" />
                </div>
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="apartment">Apartment, suite, etc. (optional)</label>
                  <input className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="apartment" name="apartment" placeholder="Apartment, suite, etc. (optional)" type="text" />
                </div>
                <div className="relative col-span-1">
                  <label className="sr-only" htmlFor="city">City</label>
                  <input autoComplete="address-level2" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="city" name="city" placeholder="City" required={true} type="text" />
                </div>
                <div className="relative col-span-1">
                  <label className="sr-only" htmlFor="postal-code">Post/Zip code</label>
                  <input autoComplete="postal-code" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="postal-code" name="postal-code" placeholder="Post/Zip code" required={true} type="text" />
                </div>
                <div className="relative col-span-1 md:col-span-2 mt-stack-sm">
                  <label className="sr-only" htmlFor="phone">Phone number</label>
                  <input autoComplete="tel" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="phone" name="phone" placeholder="Phone number" required={true} type="tel" />
                </div>
              </div>
            </div>

            <div className="pt-stack-lg mt-stack-lg border-t border-slate-grey/20">
              <button className="w-full bg-deep-navy text-pure-white py-4 px-6 font-button text-button uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 flex items-center justify-center group" type="submit">
                CONTINUE TO PAYMENT
                <span aria-hidden="true" className="material-symbols-outlined ml-2 transform group-hover:translate-x-1 transition-transform duration-300" style={{ fontSize: "18px" }}>arrow_forward</span>
              </button>
              <Link className="block text-center mt-stack-md font-label-caps text-label-caps text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 transition-colors duration-300" href="/cart">RETURN TO CART</Link>
            </div>
          </form>
        </div>
      </main>

      {/* Truecaller Simulator Modal */}
      {showTruecallerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-pure-white border border-slate-grey/20 w-full max-w-md shadow-2xl p-8 relative flex flex-col gap-6">
            <button 
              type="button" 
              onClick={() => setShowTruecallerModal(false)}
              className="absolute top-4 right-4 text-slate-grey hover:text-ink-black cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-slate-grey/15 pb-4">
              <div className="w-10 h-10 bg-[#0087FF] flex items-center justify-center rounded-full text-pure-white shrink-0">
                <span className="material-symbols-outlined text-xl">shield_with_heart</span>
              </div>
              <div>
                <h2 className="font-headline-md text-base text-deep-navy">Truecaller verification</h2>
                <p className="text-[10px] font-label-caps text-slate-grey tracking-widest uppercase">Sandbox Simulator</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-grey font-body-md">Select or modify a user profile to simulate a verified callback payload:</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimName("Dhruv Agent");
                    setSimPhone("+919876543210");
                    setSimEmail("dhruv@vrix.com");
                  }}
                  className={`p-3 border text-left cursor-pointer transition-colors ${simName === "Dhruv Agent" ? "border-deep-navy bg-soft-linen/25" : "border-slate-grey/15 hover:bg-soft-linen/10"}`}
                >
                  <p className="font-body-md text-xs font-semibold text-deep-navy">Dhruv Agent</p>
                  <p className="text-[10px] text-slate-grey">+91 98765 43210</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimName("John Doe");
                    setSimPhone("+15550199");
                    setSimEmail("john@example.com");
                  }}
                  className={`p-3 border text-left cursor-pointer transition-colors ${simName === "John Doe" ? "border-deep-navy bg-soft-linen/25" : "border-slate-grey/15 hover:bg-soft-linen/10"}`}
                >
                  <p className="font-body-md text-xs font-semibold text-deep-navy">John Doe</p>
                  <p className="text-[10px] text-slate-grey">+1 555-0199</p>
                </button>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-grey/10">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">Simulated Name</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">Simulated Phone</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">Simulated Email</label>
                  <input
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleAutofillConfirm}
                disabled={verifyLoading}
                className="w-full bg-[#0087FF] text-pure-white py-3.5 font-button text-xs uppercase tracking-widest hover:bg-[#0076E5] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {verifyLoading ? (
                  <div className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Allow & Autofill
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowTruecallerModal(false)}
                className="w-full border border-slate-grey/30 text-slate-grey py-3 font-button text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
