"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchDb, updateCMS } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";

export default function AdminShippingTaxesPage() {
  const { reloadSettings } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // --- Shipping States ---
  const [standardFee, setStandardFee] = useState<number>(1500);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(15000);
  const [shippingEnabled, setShippingEnabled] = useState<boolean>(true);
  const [shippingLabel, setShippingLabel] = useState<string>("Insured Express Delivery");
  const [deliveryTimeframe, setDeliveryTimeframe] = useState<string>("3-5 Business Days across India");

  // --- Tax & Base Amount States ---
  const [showBaseAmount, setShowBaseAmount] = useState<boolean>(true);
  const [inTaxRate, setInTaxRate] = useState<number>(18);
  const [usTaxRate, setUsTaxRate] = useState<number>(5);
  const [euTaxRate, setEuTaxRate] = useState<number>(20);
  const [taxInclusive, setTaxInclusive] = useState<boolean>(true);

  // --- Exchange Rates States ---
  const [usdRate, setUsdRate] = useState<number>(85.0);
  const [eurRate, setEurRate] = useState<number>(92.0);
  const [alwaysCeilingPrice, setAlwaysCeilingPrice] = useState<boolean>(true);

  // --- Simulator Test State ---
  const [testSubtotalInr, setTestSubtotalInr] = useState<number>(1);
  const [testCurrency, setTestCurrency] = useState<"INR" | "USD" | "EUR">("USD");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dbData = await fetchDb();

        if (dbData.shipping_settings) {
          const s = dbData.shipping_settings;
          setStandardFee(Number(s.standardFee ?? s.shippingFee ?? 1500));
          setFreeShippingThreshold(Number(s.freeShippingThreshold ?? 15000));
          setShippingEnabled(s.isEnabled !== false);
          if (s.shippingLabel) setShippingLabel(s.shippingLabel);
          if (s.deliveryTimeframe) setDeliveryTimeframe(s.deliveryTimeframe);
        }

        if (dbData.currency_settings) {
          const c = dbData.currency_settings;
          setShowBaseAmount(c.showBaseAmount !== false);
          setTaxInclusive(c.taxInclusive !== false);
          setInTaxRate(Number(c.inTaxRate ?? 18));
          setUsTaxRate(Number(c.usTaxRate ?? 5));
          setEuTaxRate(Number(c.euTaxRate ?? 20));
          setUsdRate(Number(c.usdRate || 85.0));
          setEurRate(Number(c.eurRate || 92.0));
          setAlwaysCeilingPrice(c.alwaysCeilingPrice !== false);
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        showToast("Error loading shipping and tax settings.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCMS({
        shipping_settings: {
          standardFee: Number(standardFee),
          shippingFee: Number(standardFee),
          freeShippingThreshold: Number(freeShippingThreshold),
          isEnabled: !!shippingEnabled,
          shippingLabel: shippingLabel.trim() || "Insured Express Delivery",
          deliveryTimeframe: deliveryTimeframe.trim() || "3-5 Business Days across India",
        },
        currency_settings: {
          showBaseAmount: !!showBaseAmount,
          taxInclusive: !!taxInclusive,
          inTaxRate: Number(inTaxRate),
          usTaxRate: Number(usTaxRate),
          euTaxRate: Number(euTaxRate),
          usdRate: Number(usdRate),
          eurRate: Number(eurRate),
          alwaysCeilingPrice: !!alwaysCeilingPrice,
        },
      });

      if (reloadSettings) {
        await reloadSettings();
      }

      showToast("Shipping, Base Amount, and Tax settings saved successfully!");
    } catch (err: any) {
      console.error("Save error:", err);
      showToast(err.message || "Failed to save configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Live Simulator Calculation ---
  const sim = useMemo(() => {
    const rate = testCurrency === "INR" ? 1 : testCurrency === "USD" ? 1 / usdRate : 1 / eurRate;
    const symbol = testCurrency === "INR" ? "₹" : testCurrency === "USD" ? "$" : "€";

    const format = (inr: number) => {
      const converted = inr * rate;
      if (testCurrency === "INR") return `₹${Math.round(converted).toLocaleString("en-IN")}`;
      return `${symbol}${converted.toFixed(2)}`;
    };

    const isFree = !shippingEnabled || testSubtotalInr >= freeShippingThreshold;
    const feeInr = isFree ? 0 : standardFee;
    const grandTotalInr = testSubtotalInr + feeInr;

    const taxPercent = testCurrency === "INR" ? inTaxRate : testCurrency === "EUR" ? euTaxRate : usTaxRate;
    const taxFraction = taxPercent / 100;
    const taxAmountInr = grandTotalInr * (taxFraction / (1 + taxFraction));
    const baseAmountInr = grandTotalInr - taxAmountInr;

    return {
      symbol,
      format,
      subtotalDisplay: format(testSubtotalInr),
      shippingDisplay: isFree ? "Complimentary" : format(feeInr),
      feeInr,
      isFree,
      baseAmountDisplay: format(baseAmountInr),
      taxAmountDisplay: format(taxAmountInr),
      taxPercent,
      grandTotalDisplay: format(grandTotalInr),
    };
  }, [
    testSubtotalInr,
    testCurrency,
    shippingEnabled,
    freeShippingThreshold,
    standardFee,
    usdRate,
    eurRate,
    inTaxRate,
    usTaxRate,
    euTaxRate,
  ]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-grey">
          <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
          <p className="font-label-caps text-xs tracking-widest uppercase">Loading Shipping &amp; Taxes Configuration…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
            toast.type === "success"
              ? "bg-deep-navy text-pure-white border-slate-grey/30"
              : "bg-red-900 text-pure-white border-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-grey/20 pb-5">
        <div>
          <h1 className="font-headline-lg text-2xl uppercase tracking-wider text-deep-navy">
            Shipping &amp; Taxes Management
          </h1>
          <p className="font-body-md text-xs text-slate-grey mt-1">
            Configure standard shipping fees, free shipping thresholds, base amount visibility, and regional taxation rules.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-deep-navy text-pure-white px-7 py-3 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              <span>Saving…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configurations (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Shipping Rules */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-grey/15 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-deep-navy text-xl">local_shipping</span>
                  <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy font-bold">
                    Shipping &amp; Delivery Rules
                  </h2>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingEnabled}
                    onChange={(e) => setShippingEnabled(e.target.checked)}
                    className="w-4 h-4 text-deep-navy border-slate-grey/30 rounded focus:ring-deep-navy cursor-pointer"
                  />
                  <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider font-semibold">
                    Charge Shipping Below Threshold
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    Standard Shipping Fee (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-grey text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={standardFee}
                      onChange={(e) => setStandardFee(Number(e.target.value))}
                      className="w-full border border-slate-grey/30 pl-7 pr-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                      placeholder="1500"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-grey">
                    Approx. ${(standardFee / usdRate).toFixed(2)} USD / €{(standardFee / eurRate).toFixed(2)} EUR
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    Free Shipping Threshold (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-grey text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                      className="w-full border border-slate-grey/30 pl-7 pr-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                      placeholder="15000"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-grey">
                    Orders at or above this amount receive free shipping.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    Shipping Method Label (Shown on Order Summary)
                  </label>
                  <input
                    type="text"
                    value={shippingLabel}
                    onChange={(e) => setShippingLabel(e.target.value)}
                    className="w-full border border-slate-grey/30 px-3 py-2.5 text-xs outline-none text-ink-black focus:border-deep-navy rounded-sm"
                    placeholder="e.g. Insured Express Delivery"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    Estimated Delivery Timeframe Description
                  </label>
                  <input
                    type="text"
                    value={deliveryTimeframe}
                    onChange={(e) => setDeliveryTimeframe(e.target.value)}
                    className="w-full border border-slate-grey/30 px-3 py-2.5 text-xs outline-none text-ink-black focus:border-deep-navy rounded-sm"
                    placeholder="e.g. 3-5 Business Days across India"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Base Amount & Tax Configurations */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-grey/15 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-deep-navy text-xl">receipt_long</span>
                  <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy font-bold">
                    Base Amount &amp; Taxation Settings
                  </h2>
                </div>
              </div>

              {/* Base Amount Display Switch */}
              <div className="bg-soft-linen/30 border border-slate-grey/20 p-4 rounded flex items-start gap-4">
                <input
                  type="checkbox"
                  id="showBaseAmount"
                  checked={showBaseAmount}
                  onChange={(e) => setShowBaseAmount(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-deep-navy border-slate-grey/30 rounded focus:ring-deep-navy cursor-pointer shrink-0"
                />
                <label htmlFor="showBaseAmount" className="cursor-pointer">
                  <span className="font-headline-md text-xs uppercase tracking-wider text-deep-navy font-bold block">
                    Show &ldquo;Base Amount (excl. tax)&rdquo; on Checkout Summary
                  </span>
                  <span className="font-body-md text-[11px] text-slate-grey block mt-0.5">
                    When enabled, the order summary displays the net amount before tax (&ldquo;Base Amount&rdquo;) alongside the separate GST / VAT breakdown line. When disabled, the breakdown is hidden and only Subtotal, Shipping, and Total Due are shown.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    India GST Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={inTaxRate}
                      onChange={(e) => setInTaxRate(Number(e.target.value))}
                      className="w-full border border-slate-grey/30 pr-7 pl-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                      placeholder="18"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-grey text-xs">%</span>
                  </div>
                  <p className="text-[10px] text-slate-grey">
                    Split into CGST ({(inTaxRate / 2).toFixed(1)}%) &amp; SGST ({(inTaxRate / 2).toFixed(1)}%).
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    US / Global Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={usTaxRate}
                      onChange={(e) => setUsTaxRate(Number(e.target.value))}
                      className="w-full border border-slate-grey/30 pr-7 pl-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                      placeholder="5"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-grey text-xs">%</span>
                  </div>
                  <p className="text-[10px] text-slate-grey">
                    Regional Tax / VAT applied to USD orders.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    European Union VAT (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={euTaxRate}
                      onChange={(e) => setEuTaxRate(Number(e.target.value))}
                      className="w-full border border-slate-grey/30 pr-7 pl-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                      placeholder="20"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-grey text-xs">%</span>
                  </div>
                  <p className="text-[10px] text-slate-grey">
                    VAT rate applied to EUR orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Exchange Rates */}
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-grey/15 pb-3 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-deep-navy text-xl">currency_exchange</span>
                <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy font-bold">
                  International Currency Exchange Rates
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    1 USD in INR (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={usdRate}
                    onChange={(e) => setUsdRate(Number(e.target.value))}
                    className="w-full border border-slate-grey/30 px-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                    placeholder="85.00"
                    required
                  />
                  <p className="text-[10px] text-slate-grey">
                    1 USD = ₹{usdRate.toFixed(2)} INR
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    1 EUR in INR (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eurRate}
                    onChange={(e) => setEurRate(Number(e.target.value))}
                    className="w-full border border-slate-grey/30 px-3 py-2.5 text-xs outline-none font-bold text-ink-black focus:border-deep-navy rounded-sm"
                    placeholder="92.00"
                    required
                  />
                  <p className="text-[10px] text-slate-grey">
                    1 EUR = ₹{eurRate.toFixed(2)} INR
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Simulator Card */}
          <div className="space-y-6">
            <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm sticky top-8 space-y-5">
              <div className="border-b border-slate-grey/15 pb-3">
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">visibility</span>
                  Live Checkout Simulator
                </span>
                <p className="text-[10px] text-slate-grey mt-1">
                  Preview how the Order Summary renders for customers based on your settings above.
                </p>
              </div>

              {/* Controls for simulator */}
              <div className="space-y-3 bg-soft-linen/30 p-3.5 rounded text-xs border border-slate-grey/15">
                <div className="flex justify-between items-center gap-2">
                  <label className="font-label-caps text-[10px] uppercase text-slate-grey tracking-wider">Currency</label>
                  <div className="flex gap-1">
                    {(["INR", "USD", "EUR"] as const).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setTestCurrency(cur)}
                        className={`px-2 py-1 text-[10px] font-label-caps tracking-wider rounded ${
                          testCurrency === cur
                            ? "bg-deep-navy text-pure-white font-bold"
                            : "bg-pure-white text-slate-grey border border-slate-grey/20"
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <label className="font-label-caps text-[10px] uppercase text-slate-grey tracking-wider">Test Cart (INR)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTestSubtotalInr(1)}
                      className="px-2 py-0.5 text-[9px] font-label-caps border rounded bg-pure-white hover:bg-soft-linen"
                    >
                      ₹1 (Test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestSubtotalInr(5000)}
                      className="px-2 py-0.5 text-[9px] font-label-caps border rounded bg-pure-white hover:bg-soft-linen"
                    >
                      ₹5K
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestSubtotalInr(20000)}
                      className="px-2 py-0.5 text-[9px] font-label-caps border rounded bg-pure-white hover:bg-soft-linen"
                    >
                      ₹20K (Free)
                    </button>
                  </div>
                </div>
              </div>

              {/* The Mock Order Summary */}
              <div className="border border-slate-grey/20 bg-soft-linen/40 p-5 rounded space-y-4">
                <div className="flex justify-between items-center border-b border-slate-grey/20 pb-2">
                  <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">
                    Order Summary
                  </span>
                  <span className="text-[9px] text-slate-grey font-mono uppercase">{testCurrency}</span>
                </div>

                <div className="space-y-2 text-xs font-body-md text-ink-black">
                  <div className="flex justify-between">
                    <span className="text-slate-grey">Checkout Subtotal</span>
                    <span className="font-medium">{sim.subtotalDisplay}</span>
                  </div>

                  {/* Explicit Shipping Fee Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-grey">{shippingLabel || "Shipping"}</span>
                    <span className="font-semibold">
                      {sim.isFree ? (
                        <span className="text-emerald-700 uppercase tracking-wider text-[10px] font-bold">
                          Complimentary
                        </span>
                      ) : (
                        sim.shippingDisplay
                      )}
                    </span>
                  </div>

                  {/* Dynamic Tax Breakdown */}
                  {showBaseAmount && (
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-grey/15 text-[11px] text-slate-grey">
                      <div className="flex justify-between">
                        <span>Base Amount (excl. tax)</span>
                        <span>{sim.baseAmountDisplay}</span>
                      </div>
                      {testCurrency === "INR" ? (
                        <>
                          <div className="flex justify-between">
                            <span>CGST ({(inTaxRate / 2).toFixed(1)}%)</span>
                            <span>{sim.format(sim.feeInr + testSubtotalInr > 0 ? (testSubtotalInr + sim.feeInr) * ((inTaxRate / 200) / (1 + inTaxRate / 100)) : 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST ({(inTaxRate / 2).toFixed(1)}%)</span>
                            <span>{sim.format(sim.feeInr + testSubtotalInr > 0 ? (testSubtotalInr + sim.feeInr) * ((inTaxRate / 200) / (1 + inTaxRate / 100)) : 0)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span>Regional Tax / VAT ({sim.taxPercent}%)</span>
                          <span>{sim.taxAmountDisplay}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Due */}
                  <div className="flex justify-between font-headline-md text-base border-t border-slate-grey/20 pt-3 mt-2 text-deep-navy font-bold">
                    <span>Total Due</span>
                    <span>{sim.grandTotalDisplay}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-[11px] text-emerald-800 flex items-center gap-2 font-body-md">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>Calculations update live as you change values!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save bar */}
        <div className="border-t border-slate-grey/20 pt-5 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-deep-navy text-pure-white px-8 py-3 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Saving Configurations…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
