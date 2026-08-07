import { useState, useEffect } from "react";
import { fetchDb } from "./api";

export interface CurrencyConfig {
  usdRate: number;
  eurRate: number;
  inTaxRate: number;
  usTaxRate: number;
  euTaxRate: number;
  alwaysCeilingPrice: boolean;
}

export type SupportedCurrency = "INR" | "USD" | "EUR";

// Default fallback conversion rules
const DEFAULT_CONFIG: CurrencyConfig = {
  usdRate: 85.0,
  eurRate: 92.0,
  inTaxRate: 18,
  usTaxRate: 0,
  euTaxRate: 20,
  alwaysCeilingPrice: true
};

export function useCurrency() {
  const [currency, setCurrency] = useState<SupportedCurrency>("INR");
  const [countryCode, setCountryCode] = useState<string>("IN");
  const [config, setConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    // If inside admin panel routes, lock currency to INR for admin calculations
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      setCurrency("INR");
      setCountryCode("IN");
      return;
    }

    // Load config from DB
    fetchDb().then(res => {
      if (res.currency_settings) {
        setConfig({
          usdRate: Number(res.currency_settings.usdRate || 85),
          eurRate: Number(res.currency_settings.eurRate || 92),
          inTaxRate: Number(res.currency_settings.inTaxRate || 18),
          usTaxRate: Number(res.currency_settings.usTaxRate || 0),
          euTaxRate: Number(res.currency_settings.euTaxRate || 20),
          alwaysCeilingPrice: res.currency_settings.alwaysCeilingPrice !== false
        });
      }
    }).catch(() => {});

    // Detect country Code via free API
    const cachedCountry = localStorage.getItem("vrix-country");
    const cachedCurrency = localStorage.getItem("vrix-currency") as SupportedCurrency;

    if (cachedCurrency) {
      setCurrency(cachedCurrency);
    }
    if (cachedCountry) {
      setCountryCode(cachedCountry);
    } else {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data.country_code) {
            const country = data.country_code.toUpperCase();
            setCountryCode(country);
            localStorage.setItem("vrix-country", country);
            
            // Auto map to currency
            let detectedCurrency: SupportedCurrency = "INR";
            if (["US", "CA", "AU", "NZ", "SG", "HK"].includes(country)) {
              detectedCurrency = "USD";
            } else if (["AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "GB"].includes(country)) {
              detectedCurrency = "EUR";
            }
            if (!cachedCurrency) {
              setCurrency(detectedCurrency);
              localStorage.setItem("vrix-currency", detectedCurrency);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const changeCurrency = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("vrix-currency", newCurrency);
  };

  const convertPrice = (priceInInr: number): number => {
    const amount = Number(priceInInr);
    if (isNaN(amount) || amount <= 0) return 0;
    
    if (currency === "INR") {
      return amount;
    }

    let converted = amount;
    if (currency === "USD") {
      converted = amount / config.usdRate;
    } else if (currency === "EUR") {
      converted = amount / config.eurRate;
    }

    // Dynamic Ceiling rounding logic
    if (config.alwaysCeilingPrice) {
      return Math.ceil(converted);
    }
    return Number(converted.toFixed(2));
  };

  const getTaxRate = (): number => {
    if (currency === "INR" || countryCode === "IN") return config.inTaxRate;
    // European countries
    if (currency === "EUR") return config.euTaxRate;
    // USA
    if (currency === "USD" && countryCode === "US") return config.usTaxRate;
    return 5; // Default international flat tax
  };

  const formatPrice = (priceInInr: number): string => {
    const converted = convertPrice(priceInInr);
    const symbolMap: Record<SupportedCurrency, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€"
    };
    
    const symbol = symbolMap[currency];
    if (currency === "INR") {
      return `${symbol}${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  return {
    currency,
    countryCode,
    changeCurrency,
    convertPrice,
    getTaxRate,
    formatPrice,
    config
  };
}
