import express from "express";
import { db } from "../database.js";

const router = express.Router();

// Memory cache for IP lookups (1 hour TTL)
const geoCache = new Map();

// Country code to European / Global Currency fallback map
const COUNTRY_TO_CURRENCY = {
  IN: { currency: "INR", name: "India" },
  GB: { currency: "GBP", name: "United Kingdom" },
  DE: { currency: "EUR", name: "Germany" },
  FR: { currency: "EUR", name: "France" },
  IT: { currency: "EUR", name: "Italy" },
  ES: { currency: "EUR", name: "Spain" },
  NL: { currency: "EUR", name: "Netherlands" },
  BE: { currency: "EUR", name: "Belgium" },
  AT: { currency: "EUR", name: "Austria" },
  PT: { currency: "EUR", name: "Portugal" },
  IE: { currency: "EUR", name: "Ireland" },
  FI: { currency: "EUR", name: "Finland" },
  GR: { currency: "EUR", name: "Greece" },
  SE: { currency: "EUR", name: "Sweden" },
  DK: { currency: "EUR", name: "Denmark" },
  PL: { currency: "EUR", name: "Poland" },
  US: { currency: "USD", name: "United States" },
  CA: { currency: "USD", name: "Canada" },
  AU: { currency: "USD", name: "Australia" },
  SG: { currency: "USD", name: "Singapore" },
  AE: { currency: "USD", name: "United Arab Emirates" }
};

// GET /api/geo/detect — Geo IP Auto detection endpoint
router.get("/detect", async (req, res) => {
  try {
    let settings = {};
    try {
      if (db.cmsSettings) {
        settings = (await db.cmsSettings.findUnique({ where: { key: "currency_settings" } })) || {};
      }
    } catch (e) {}

    const autoDetectEnabled = settings.autoDetectByIP !== false;

    if (!autoDetectEnabled) {
      return res.json({
        autoDetect: false,
        country: settings.fallbackCountry || "IN",
        countryName: "India",
        currency: settings.defaultCurrency || "INR",
      });
    }

    // Get IP address
    let rawIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket.remoteAddress || "";
    let ip = String(rawIp).split(",")[0].trim();

    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      // Local IP — check header cloudflare / vercel location if provided
      const cfCountry = req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"];
      if (cfCountry && cfCountry.length === 2) {
        const countryUpper = cfCountry.toUpperCase();
        const mapped = COUNTRY_TO_CURRENCY[countryUpper] || { currency: "USD", name: countryUpper };
        return res.json({
          autoDetect: true,
          isHeader: true,
          country: countryUpper,
          countryName: mapped.name,
          currency: mapped.currency,
        });
      }

      return res.json({
        autoDetect: true,
        isLocal: true,
        country: settings.fallbackCountry || "IN",
        countryName: "India",
        currency: settings.defaultCurrency || "INR",
      });
    }

    // Check Cache
    const cached = geoCache.get(ip);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Fetch Geo-IP from primary API (ipapi.co)
    let country = "IN";
    let countryName = "India";
    let currency = "INR";

    try {
      const resp = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "User-Agent": "VRIX-Ecommerce/1.0" } });
      if (resp.ok) {
        const data = await resp.json();
        if (data.country_code) {
          country = data.country_code.toUpperCase();
          countryName = data.country_name || country;
          currency = data.currency || (COUNTRY_TO_CURRENCY[country]?.currency || "USD");
        }
      }
    } catch (e) {
      // Fallback API (ip-api.com)
      try {
        const resp2 = await fetch(`http://ip-api.com/json/${ip}`);
        if (resp2.ok) {
          const data2 = await resp2.json();
          if (data2.countryCode) {
            country = data2.countryCode.toUpperCase();
            countryName = data2.country || country;
            currency = COUNTRY_TO_CURRENCY[country]?.currency || "USD";
          }
        }
      } catch (err) {}
    }

    const payload = { autoDetect: true, country, countryName, currency };
    geoCache.set(ip, { data: payload, expiry: Date.now() + 3600 * 1000 });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to detect geolocation" });
  }
});

export default router;
