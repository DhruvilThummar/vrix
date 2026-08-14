import { getTransporter, sendEmailWithTimeout, getApiSettings } from "./apiResolvers.js";

/**
 * Sends a security email notification to the user whenever they successfully log in,
 * including their IP address, Geolocation (City, Country), Device details, and timestamp.
 */
export function sendUserLoginSecurityAlert({ userEmail, userName, req }) {
  if (!userEmail) return;

  // Run asynchronously without blocking HTTP response
  (async () => {
    try {
      // 1. Extract IP
      const rawIp = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "127.0.0.1";
      const ip = String(rawIp).split(",")[0].trim();

      // 2. Extract Device / User Agent
      const userAgent = req?.headers?.["user-agent"] || "Unknown Device / Browser";

      // 3. Extract Location (Check Vercel/Cloudflare Headers first)
      let city = req?.headers?.["x-vercel-ip-city"] || req?.headers?.["cf-ipcity"] || "";
      let region = req?.headers?.["x-vercel-ip-country-region"] || "";
      let country = req?.headers?.["x-vercel-ip-country"] || req?.headers?.["cf-ipcountry"] || "";
      let locationStr = [city, region, country].filter(Boolean).join(", ");

      // If headers aren't present and IP is public, fetch from Geolocation API
      if (!locationStr && ip && ip !== "::1" && ip !== "127.0.0.1" && !ip.startsWith("192.168.") && !ip.startsWith("10.") && !ip.startsWith("172.")) {
        try {
          const resp = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "User-Agent": "VRIX-Ecommerce/1.0" } });
          if (resp.ok) {
            const geoData = await resp.json();
            if (geoData.city || geoData.country_name) {
              locationStr = [geoData.city, geoData.region, geoData.country_name].filter(Boolean).join(", ");
            }
          }
        } catch (e) {
          try {
            const resp2 = await fetch(`http://ip-api.com/json/${ip}`);
            if (resp2.ok) {
              const geoData2 = await resp2.json();
              if (geoData2.city || geoData2.country) {
                locationStr = [geoData2.city, geoData2.regionName, geoData2.country].filter(Boolean).join(", ");
              }
            }
          } catch (e2) {}
        }
      }

      if (!locationStr) {
        locationStr = "India (Detected Route)";
      }

      // 4. Date and Time Format
      const loginTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      // 5. Send Mail
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const apiSettings = await getApiSettings();
        const senderEmail = apiSettings?.nodemailerUser || process.env.SMTP_USER || "info@vrixjewels.com";

        await sendEmailWithTimeout(activeTransporter, {
          from: `"VRIX Security" <${senderEmail}>`,
          to: String(userEmail).trim().toLowerCase(),
          subject: "🛡️ Security Alert: New Sign-In to your VRIX Account",
          html: `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#FAF8F5;border:1px solid #E5E3DF;color:#0F1728;">
              <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #E5E3DF;">
                <h1 style="font-size:22px;letter-spacing:6px;color:#0F1728;text-transform:uppercase;margin:0;">VRIX</h1>
                <p style="font-size:10px;letter-spacing:3px;color:#7A7A7A;text-transform:uppercase;margin:4px 0 0;">FINE JEWELLERY</p>
              </div>

              <div style="padding:24px 0;">
                <h3 style="font-size:16px;color:#0F1728;margin:0 0 12px;font-weight:600;">Security Notification: New Account Sign-In</h3>
                <p style="font-size:13px;line-height:1.6;color:#555;margin:0 0 20px;">
                  Hello <strong>${userName || 'Valued Member'}</strong>,<br>
                  Your VRIX account (<strong>${userEmail}</strong>) was successfully logged in.
                </p>

                <div style="background:#FFFFFF;border:1px solid #E5E3DF;padding:20px;margin-bottom:20px;border-left:4px solid #0F1728;">
                  <table style="width:100%;font-size:12px;color:#333;border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;color:#7A7A7A;width:120px;"><strong>Date &amp; Time:</strong></td>
                      <td style="padding:6px 0;"><strong>${loginTime} (IST)</strong></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#7A7A7A;"><strong>IP Address:</strong></td>
                      <td style="padding:6px 0;"><code style="background:#F4F4F4;padding:2px 6px;border-radius:3px;">${ip}</code></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#7A7A7A;"><strong>Location:</strong></td>
                      <td style="padding:6px 0;"><strong>${locationStr}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#7A7A7A;"><strong>Browser / Device:</strong></td>
                      <td style="padding:6px 0;font-size:11px;color:#555;">${userAgent}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size:12px;line-height:1.5;color:#777;margin:0;">
                  If this was you, no further action is required. If you did not recognize this login activity, please change your password immediately.
                </p>
              </div>

              <div style="text-align:center;padding-top:20px;border-top:1px solid #E5E3DF;font-size:11px;color:#999;">
                &copy; ${new Date().getFullYear()} VRIX Fine Jewellery. All rights reserved.
              </div>
            </div>
          `,
        }, 12000);
      } else {
        console.log(`[DEV MODE] Security Login Alert for ${userEmail} (IP: ${ip}, Location: ${locationStr})`);
      }
    } catch (err) {
      console.warn("Security login email warning:", err.message);
    }
  })();
}
