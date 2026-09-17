"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchDb, getApiBaseUrl } from "@/utils/api";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // Conversion multiplier from INR (Base price is in INR)
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

export interface ShippingSettings {
  standardFee: number;
  freeShippingThreshold: number;
  isEnabled: boolean;
  shippingLabel: string;
}

export interface SystemSettings {
  showBaseAmount: boolean;
  taxInclusive: boolean;
  inTaxRate: number;
  usTaxRate: number;
  euTaxRate: number;
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
  shippingSettings: ShippingSettings;
  systemSettings: SystemSettings;
  formatPrice: (inrAmount: number) => string;
  formatPriceRaw: (inrAmount: number) => number;
  setCurrency: (code: string) => void;
  isAutoDetected: boolean;
  reloadSettings: () => Promise<void>;
}

const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", rate: 1, locale: "en-IN", countries: ["IN"] },
  { code: "EUR", symbol: "€", rate: 0.011, locale: "de-DE", countries: ["DE","FR","IT","ES","NL","BE","AT","PT","IE","FI","GR","SE","DK","PL"] },
  { code: "GBP", symbol: "£", rate: 0.0095, locale: "en-GB", countries: ["GB"] },
  { code: "USD", symbol: "$", rate: 0.012, locale: "en-US", countries: ["US","CA","AU","SG","AE"] },
];

const DEFAULT_TAX_RULES: TaxRule[] = [
  { country: "IN", taxName: "GST", rate: 3, inclusive: true, label: "Prices include 3% GST" },
  { country: "GB", taxName: "VAT", rate: 20, inclusive: true, label: "Prices include 20% VAT" },
  { country: "DE", taxName: "MwSt", rate: 19, inclusive: true, label: "Preise inkl. 19% MwSt" },
  { country: "FR", taxName: "TVA", rate: 20, inclusive: true, label: "Prix TTC (TVA 20%)" },
  { country: "IT", taxName: "IVA", rate: 22, inclusive: true, label: "Prezzi inclusi IVA 22%" },
  { country: "ES", taxName: "IVA", rate: 21, inclusive: true, label: "Precios incl. 21% IVA" },
  { country: "NL", taxName: "BTW", rate: 21, inclusive: true, label: "Prijzen incl. 21% BTW" },
  { country: "BE", taxName: "TVA/BTW", rate: 21, inclusive: true, label: "Prices incl. 21% VAT" },
  { country: "AT", taxName: "MwSt", rate: 20, inclusive: true, label: "Preise inkl. 20% MwSt" },
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

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    standardFee: 1500,
    freeShippingThreshold: 15000,
    isEnabled: true,
    shippingLabel: "Insured Express Delivery",
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    showBaseAmount: true,
    taxInclusive: true,
    inTaxRate: 18,
    usTaxRate: 5,
    euTaxRate: 20,
  });

  const loadSettingsFromDb = useCallback(async () => {
    try {
      const dbData = await fetchDb();
      if (dbData.shipping_settings) {
        setShippingSettings({
          standardFee: Number(dbData.shipping_settings.standardFee ?? dbData.shipping_settings.shippingFee ?? 1500),
          freeShippingThreshold: Number(dbData.shipping_settings.freeShippingThreshold ?? 15000),
          isEnabled: dbData.shipping_settings.isEnabled !== false,
          shippingLabel: dbData.shipping_settings.shippingLabel || "Insured Express Delivery",
        });
      }
      if (dbData.currency_settings) {
        const curSettings = dbData.currency_settings;
        setSystemSettings({
          showBaseAmount: curSettings.showBaseAmount !== false,
          taxInclusive: curSettings.taxInclusive !== false,
          inTaxRate: Number(curSettings.inTaxRate ?? 18),
          usTaxRate: Number(curSettings.usTaxRate ?? 5),
          euTaxRate: Number(curSettings.euTaxRate ?? 20),
        });

        if (curSettings.inTaxRate !== undefined || curSettings.usTaxRate !== undefined || curSettings.euTaxRate !== undefined) {
          setTaxRules((prev) =>
            prev.map((rule) => {
              if (rule.country === "IN" && curSettings.inTaxRate !== undefined) {
                return { ...rule, rate: Number(curSettings.inTaxRate) };
              }
              if (rule.country === "US" && curSettings.usTaxRate !== undefined) {
                return { ...rule, rate: Number(curSettings.usTaxRate) };
              }
              if (["GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT"].includes(rule.country) && curSettings.euTaxRate !== undefined) {
                return { ...rule, rate: Number(curSettings.euTaxRate) };
              }
              return rule;
            })
          );
        }

        if (curSettings.usdRate || curSettings.eurRate) {
          setSupportedCurrencies((prev) =>
            prev.map((c) => {
              if (c.code === "USD" && curSettings.usdRate) {
                return { ...c, rate: Number((1 / Number(curSettings.usdRate)).toFixed(4)) };
              }
              if (c.code === "EUR" && curSettings.eurRate) {
                return { ...c, rate: Number((1 / Number(curSettings.eurRate)).toFixed(4)) };
              }
              return c;
            })
          );
        }

        if (curSettings.supportedCurrencies?.length) setSupportedCurrencies(curSettings.supportedCurrencies);
        if (curSettings.taxRules?.length) setTaxRules(curSettings.taxRules);
      }
    } catch (e) {
      console.warn("Failed to load currency & shipping settings from db", e);
    }
  }, []);

  // Initialize from DB & Geo API
  useEffect(() => {
    async function init() {
      await loadSettingsFromDb();

      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        setCurrencyState("INR");
        setDetectedCountry("IN");
        setDetectedCountryName("India");
        setIsAutoDetected(false);
        return;
      }

      let currentCountry = "IN";
      let currentCountryName = "India";

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
            const activeList = supportedCurrencies.length ? supportedCurrencies : DEFAULT_CURRENCIES;
            const matched = activeList.find((c: CurrencyConfig) => c.countries?.includes(currentCountry));
            if (matched) {
              setCurrencyState(matched.code);
              setIsAutoDetected(true);
            } else if (geo.currency) {
              const matchedByCode = activeList.find((c: CurrencyConfig) => c.code === geo.currency);
              if (matchedByCode) {
                setCurrencyState(matchedByCode.code);
                setIsAutoDetected(true);
              }
            }
          }
        }
      } catch (err) {}
    }

    init();
  }, [loadSettingsFromDb]);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    setIsAutoDetected(false);
    localStorage.setItem("vrix-currency", code);
  }, []);

  const activeCurConfig = supportedCurrencies.find((c) => c.code === currency) || supportedCurrencies[0] || DEFAULT_CURRENCIES[0];
  const activeTaxRule = taxRules.find((t) => t.country === detectedCountry) || taxRules.find((t) => t.country === "*") || DEFAULT_TAX_RULES[0];

  const formatPriceRaw = useCallback(
    (inrAmount: number) => {
      const num = Number(inrAmount);
      if (isNaN(num) || num <= 0) return 0;
      const converted = num * activeCurConfig.rate;
      if (activeCurConfig.code === "INR") {
        return Math.round(converted);
      }
      return Number(converted.toFixed(2));
    },
    [activeCurConfig.code, activeCurConfig.rate]
  );

  const formatPrice = useCallback(
    (inrAmount: number) => {
      const val = formatPriceRaw(inrAmount);
      if (activeCurConfig.code === "INR") {
        return `${activeCurConfig.symbol}${val.toLocaleString(activeCurConfig.locale || "en-IN")}`;
      }
      return `${activeCurConfig.symbol}${val.toLocaleString(activeCurConfig.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [activeCurConfig.code, activeCurConfig.symbol, activeCurConfig.locale, formatPriceRaw]
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
        shippingSettings,
        systemSettings,
        formatPrice,
        formatPriceRaw,
        setCurrency,
        isAutoDetected,
        reloadSettings: loadSettingsFromDb,
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

