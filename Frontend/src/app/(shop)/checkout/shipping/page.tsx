"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCheckoutStorage } from "@/hooks/useCheckoutStorage";
import GiftWrappingSection from "@/components/checkout/GiftWrappingSection";
import { ShippingData } from "@/types/checkout";

interface FormErrors {
  email?: string;
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
}

export default function ShippingPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { subtotal, discount, promoType } = useCart();
  const { currency } = useCurrency();
  const { setShipping, shipping: savedShipping, isLoaded } = useCheckoutStorage();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
    }
  }, [isLoggedIn, router]);

  // Form State
  const [country, setCountry] = useState("IN");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  // Auto-populate from user auth or saved session
  useEffect(() => {
    if (savedShipping) {
      setCountry(savedShipping.country || "IN");
      setEmail(savedShipping.email || "");
      setFullName(savedShipping.fullName || "");
      setAddress(savedShipping.address || "");
      setApartment(savedShipping.apartment || "");
      setCity(savedShipping.city || "");
      setPostalCode(savedShipping.postalCode || "");
      setPhone(savedShipping.phone || "");
    } else if (user) {
      if (user.email) setEmail(user.email);
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
    }
  }, [user, savedShipping]);

  // Discount & Shipping calculations
  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;

  const finalSubtotal = Math.max(0, subtotal - discountAmount);
  const rawShippingFee = finalSubtotal >= 15000 ? 0 : 1500;
  const grandTotal = finalSubtotal + rawShippingFee;

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }
    if (!address.trim()) {
      newErrors.address = "Street address is required.";
    }
    if (!city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!postalCode.trim()) {
      newErrors.postalCode = "Postal/ZIP code is required.";
    }
    if (!phone.trim() || phone.trim().length < 8) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const shippingData: ShippingData = {
      email,
      fullName,
      country,
      address,
      apartment,
      city,
      postalCode,
      phone,
      grandTotal,
      currency: currency || "INR",
    };

    setShipping(shippingData);
    router.push("/checkout/payment");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
        Loading shipping details…
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-pure-white">
      <main className="flex-grow w-full max-w-[800px] mx-auto px-margin-mobile md:px-0 py-section-gap flex flex-col">
        {/* Step Progress Indicator */}
        <nav aria-label="Progress" className="mb-stack-lg w-full">
          <ol className="flex justify-between items-center w-full border-b border-slate-grey/20 pb-4" role="list">
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-ink-black border-b border-ink-black pb-4 block w-full">
                1 SHIPPING
              </span>
            </li>
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-slate-grey pb-4 block w-full">
                2 PAYMENT
              </span>
            </li>
            <li className="relative text-center w-1/3">
              <span className="font-label-caps text-label-caps text-slate-grey pb-4 block w-full">
                3 CONFIRMATION
              </span>
            </li>
          </ol>
        </nav>

        <div className="w-full mt-stack-lg">
          <h1 className="font-headline-md text-headline-md mb-stack-lg uppercase text-center md:text-left">
            Shipping Information
          </h1>

          <form onSubmit={handleSubmit} className="space-y-stack-lg" noValidate>
            {/* Contact Information */}
            <div className="space-y-stack-md">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">
                Contact
              </h2>
              <div className="relative">
                <label className="sr-only" htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="Email address"
                  className={`block w-full border-0 border-b bg-transparent py-3 pl-0 pr-10 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                    errors.email ? "border-red-500" : "border-slate-grey/30"
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-stack-md mt-stack-lg">
              <h2 className="font-label-caps text-label-caps text-slate-grey uppercase mb-stack-sm">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                {/* Country */}
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="country">Country/Region</label>
                  <select
                    id="country"
                    name="country"
                    autoComplete="country-name"
                    value={country.toLowerCase()}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black focus:border-deep-navy focus:ring-0 sm:text-body-md appearance-none transition-colors duration-300"
                  >
                    <option value="in">India</option>
                    <option value="us">United States</option>
                    <option value="fr">France</option>
                    <option value="de">Germany</option>
                    <option value="gb">United Kingdom</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <span className="material-symbols-outlined text-slate-grey text-[20px]">expand_more</span>
                  </div>
                </div>

                {/* Full Name */}
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    name="full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                    }}
                    placeholder="Full name"
                    className={`block w-full border-0 border-b bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                      errors.fullName ? "border-red-500" : "border-slate-grey/30"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Street Address */}
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors({ ...errors, address: undefined });
                    }}
                    placeholder="Address"
                    className={`block w-full border-0 border-b bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                      errors.address ? "border-red-500" : "border-slate-grey/30"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Apartment */}
                <div className="relative col-span-1 md:col-span-2">
                  <label className="sr-only" htmlFor="apartment">Apartment, suite, etc. (optional)</label>
                  <input
                    id="apartment"
                    name="apartment"
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                    className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300"
                  />
                </div>

                {/* City */}
                <div className="relative col-span-1">
                  <label className="sr-only" htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors({ ...errors, city: undefined });
                    }}
                    placeholder="City"
                    className={`block w-full border-0 border-b bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                      errors.city ? "border-red-500" : "border-slate-grey/30"
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div className="relative col-span-1">
                  <label className="sr-only" htmlFor="postal-code">Post/Zip code</label>
                  <input
                    id="postal-code"
                    name="postal-code"
                    type="text"
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (errors.postalCode) setErrors({ ...errors, postalCode: undefined });
                    }}
                    placeholder="Post/Zip code"
                    className={`block w-full border-0 border-b bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                      errors.postalCode ? "border-red-500" : "border-slate-grey/30"
                    }`}
                  />
                  {errors.postalCode && (
                    <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.postalCode}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="relative col-span-1 md:col-span-2 mt-stack-sm">
                  <label className="sr-only" htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="Phone number"
                    className={`block w-full border-0 border-b bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 sm:text-body-md transition-colors duration-300 ${
                      errors.phone ? "border-red-500" : "border-slate-grey/30"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-600 font-body-md mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Gift Wrapping Options */}
            <div className="mt-stack-lg">
              <GiftWrappingSection />
            </div>

            {/* Action Buttons */}
            <div className="pt-stack-lg mt-stack-lg border-t border-slate-grey/20">
              <button
                type="submit"
                className="w-full bg-deep-navy text-pure-white py-4 px-6 font-button text-button uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 flex items-center justify-center group cursor-pointer shadow-md"
              >
                <span>CONTINUE TO PAYMENT</span>
                <span className="material-symbols-outlined ml-2 transform group-hover:translate-x-1 transition-transform duration-300 text-[18px]">
                  arrow_forward
                </span>
              </button>
              <Link
                href="/cart"
                className="block text-center mt-stack-md font-label-caps text-label-caps text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 transition-colors"
              >
                RETURN TO CART
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
