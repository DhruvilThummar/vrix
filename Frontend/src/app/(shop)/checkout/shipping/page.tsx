"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { fetchDbPublic as fetchDb } from "@/utils/api";

import { useAuth } from "@/context/AuthContext";
import GiftWrappingSection from "@/components/checkout/GiftWrappingSection";
import { useCurrency } from "@/context/CurrencyContext";

export default function Page() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { subtotal, discount, promoType } = useCart();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
    }
  }, [isLoggedIn, router]);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFullName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };


  const { formatPrice, formatPriceRaw, currency, taxRate, taxName, taxLabel } = useCurrency();
  const [country, setCountry] = useState("IN");

  // Update country mapping from select field
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value.toUpperCase());
  };

  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;

  const finalSubtotal = Math.max(0, subtotal - discountAmount);
  const rawShippingFee = finalSubtotal >= 15000 ? 0 : 1500;

  const grandTotal = finalSubtotal + rawShippingFee;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const email = fd.get("email") as string;
    const fullName = fd.get("full-name") as string;
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
      grandTotal: formatPriceRaw(grandTotal),
      grandTotalInr: grandTotal,
      currency
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



            <div className="space-y-stack-md">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">Contact</h2>
              <div className="relative">
                <label className="sr-only" htmlFor="email">Email address</label>
                <input autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="email" name="email" placeholder="Email address" required={true} type="email" />
              </div>
            </div>

            <div className="space-y-stack-md mt-stack-lg">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="country">Country/Region</label>
                  <select 
                    autoComplete="country-name" 
                    value={country.toLowerCase()} 
                    onChange={handleCountryChange} 
                    className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black focus:border-deep-navy focus:ring-0 sm:text-body-md appearance-none transition-colors duration-300" 
                    id="country" 
                    name="country"
                  >
                    <option value="in">India</option>
                    <option value="us">United States</option>
                    <option value="fr">France</option>
                    <option value="de">Germany</option>
                    <option value="gb">United Kingdom</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <span aria-hidden="true" className="material-symbols-outlined text-slate-grey" style={{ fontSize: "20px" }}>expand_more</span>
                  </div>
                </div>
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="full-name">Full name</label>
                  <input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="full-name" name="full-name" placeholder="Full name" required={true} type="text" />
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
                  <input autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300" id="phone" name="phone" placeholder="Phone number" required={true} type="tel" />
                </div>
              </div>
            </div>
            <div className="mt-stack-lg">
              <GiftWrappingSection />
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
