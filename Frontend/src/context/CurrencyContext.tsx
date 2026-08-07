"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchDb, getApiBaseUrl } from "@/utils/api";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  locale: string;
  countries: string[];
}

export interface TaxRule {
  country: string;
  taxName: string;
  rate: number;
  inclusive: boolean;
  label: string;
}

interface CurrencyContextType {
  detectedCountry: string;
  detectedCountryName: string;
  currency: string;
  symbol: string;
  rate: number;
  locale: string;
  taxName: string;
  taxRate: number;
  taxInclusive: boolean;
  taxLabel: string;
  supportedCurrencies: CurrencyConfig[];
  formatPrice: (inrAmount: number) => string;
  formatPriceRaw: (inrAmount: number) => number;
  setCurrency: (code: string) => void;
  isAutoDetected: boolean;
}

const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", rate: 1, locale: "en-IN", countries: ["IN"] },
  { code: "EUR", symbol: "€", rate: 0.011, locale: "de-DE", countries: ["DE","FR","IT","ES","NL","BE","AT","PT","IE","FI","GR"] },
  { code: "GBP", symbol: "£", rate: 0.0095, locale: "en-GB", countries: ["GB"] },
  { code: "USD", symbol: "$", rate: 0.012, locale: "en-US", countries: ["US","CA","AU","SG"] },
];

const DEFAULT_TAX_RULES: TaxRule[] = [
  { country: "IN", taxName: "GST", rate: 3, inclusive: true, label: "Prices include 3% GST" },
  { country: "GB", taxName: "VAT", rate: 20, inclusive: true, label: "Prices include 20% VAT" },
  { country: "DE", taxName: "MwSt", rate: 19, inclusive: true, label: "Preise inkl. 19% MwSt" },
  { country: "FR", taxName: "TVA", rate: 20, inclusive: true, label: "Prix TTC (TVA 20%)" },
  { country: "US", taxName: "Sales Tax", rate: 0, inclusive: false, label: "Tax calculated at checkout" },
  { country: "*", taxName: "Tax", rate: 0, inclusive: false, label: "Tax may apply at checkout" },
];

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [supportedCurrencies, setSupportedCurrencies] = useState<CurrencyConfig[]>(DEFAULT_CURRENCIES);
  const [taxRules, setTaxRules] = useState<TaxRule[]>(DEFAULT_TAX_RULES);
  const [detectedCountry, setDetectedCountry] = useState("IN");
  const [detectedCountryName, setDetectedCountryName] = useState("India");
  const [currency, setCurrencyState] = useState("INR");
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // Initialize from DB & Geo API
  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        setCurrencyState("INR");
        setDetectedCountry("IN");
        setDetectedCountryName("India");
        setIsAutoDetected(false);
        return;
      }

      let currentCountry = "IN";
      let currentCountryName = "India";
      let curSettings: any = null;

      try {
        const dbData = await fetchDb();
        if (dbData.currency_settings) {
          curSettings = dbData.currency_settings;
          if (curSettings.supportedCurrencies?.length) setSupportedCurrencies(curSettings.supportedCurrencies);
          if (curSettings.taxRules?.length) setTaxRules(curSettings.taxRules);
        }
      } catch (e) {}

      // Check saved user preference first
      const savedCur = localStorage.getItem("vrix-currency");
      if (savedCur) {
        setCurrencyState(savedCur);
        setIsAutoDetected(false);
        return;
      }

      // Geo-IP Auto Detection
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/geo/detect`);
        if (res.ok) {
          const geo = await res.json();
          if (geo.country) {
            currentCountry = geo.country;
            currentCountryName = geo.countryName || currentCountry;
            setDetectedCountry(currentCountry);
            setDetectedCountryName(currentCountryName);

            // Match currency by country
            const activeList = curSettings?.supportedCurrencies?.length ? curSettings.supportedCurrencies : DEFAULT_CURRENCIES;
            const matched = activeList.find((c: CurrencyConfig) => c.countries?.includes(currentCountry));
            if (matched) {
              setCurrencyState(matched.code);
              setIsAutoDetected(true);
            }
          }
        }
      } catch (err) {}
    }

    init();
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    setIsAutoDetected(false);
    localStorage.setItem("vrix-currency", code);
  }, []);

  const activeCurConfig = supportedCurrencies.find((c) => c.code === currency) || supportedCurrencies[0] || DEFAULT_CURRENCIES[0];
  const activeTaxRule = taxRules.find((t) => t.country === detectedCountry) || taxRules.find((t) => t.country === "*") || DEFAULT_TAX_RULES[0];

  const formatPriceRaw = useCallback(
    (inrAmount: number) => {
      const converted = inrAmount * activeCurConfig.rate;
      return Number(converted.toFixed(2));
    },
    [activeCurConfig.rate]
  );

  const formatPrice = useCallback(
    (inrAmount: number) => {
      const val = formatPriceRaw(inrAmount);
      return `${activeCurConfig.symbol}${val.toLocaleString(activeCurConfig.locale || "en-US")}`;
    },
    [activeCurConfig.symbol, activeCurConfig.locale, formatPriceRaw]
  );

  return (
    <CurrencyContext.Provider
      value={{
        detectedCountry,
        detectedCountryName,
        currency: activeCurConfig.code,
        symbol: activeCurConfig.symbol,
        rate: activeCurConfig.rate,
        locale: activeCurConfig.locale,
        taxName: activeTaxRule.taxName,
        taxRate: activeTaxRule.rate,
        taxInclusive: activeTaxRule.inclusive,
        taxLabel: activeTaxRule.label,
        supportedCurrencies,
        formatPrice,
        formatPriceRaw,
        setCurrency,
        isAutoDetected,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
