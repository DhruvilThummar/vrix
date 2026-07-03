# Truecaller Developer Panel Setup Guide

This guide details how to configure Truecaller Verification for your website using the Truecaller Developer Portal.

---

## 1. Registering Your Web App on Truecaller Developer Portal

1. **Create an Account:**
   - Navigate to the [Truecaller Developer Portal](https://developer.truecaller.com/).
   - Sign up or log in.

2. **Add a New Application:**
   - Go to the **Applications** dashboard and click **Add Application**.
   - Select **Web** as the target platform.

3. **Configure App Fields:**
   - **App Name:** Enter your customer-facing name (e.g., `VRIX`).
   - **App Domain:** Enter the exact domain of your website where the verification button lives.
     - For production: `https://vrix.vercel.app` (or your active Vercel domain).
     - For local development: `http://localhost:3000` (Note: Truecaller require HTTPS for live flows, but you can toggle **Sandbox Mode** in VRIX admin panel for testing).
   - **Callback URL:** Truecaller will send a secure POST request to this endpoint containing the user profiles once verified.
     - In VRIX, this endpoint corresponds to: `https://your-backend-domain.com/api/truecaller/verify`
     - Response timeout must be within **3 seconds**.

4. **Obtain API Keys:**
   - Once saved, Truecaller will generate your **Partner Key** (also referred to as App Key) and **App ID**.
   - Copy these values and paste them into your backend environment file (`Backend/.env`) or configure them through the VRIX Admin Panel under API Settings:
     ```env
     TRUECALLER_PARTNER_KEY=your_partner_key_here
     TRUECALLER_APP_ID=your_app_id_here
     TRUECALLER_SANDBOX_MODE=true # Toggle to false when deploying live HTTPS
     ```

---

## 2. Web SDK Deep-Link & Focus Verification Flow

Truecaller verification on the mobile web relies on a deep-link mechanism. When the user clicks the verification button:

1. **Triggering Deep Link:** The web app launches a deep link to the Truecaller mobile app:
   ```javascript
   window.location = "truecallersdk://truesdk/web_verify?requestNonce=UNIQUE_NONCE&partnerKey=PARTNER_KEY&partnerName=VRIX";
   ```
2. **Focus Detection:** Since deep links can't natively return success/failure in all browsers, the SDK uses focus detection:
   ```javascript
   let hasFocus = true;
   window.onblur = () => { hasFocus = false; }; // Browser lost focus -> Truecaller app opened
   
   setTimeout(() => {
     if (hasFocus) {
       // App is NOT installed -> Trigger fallback flow
       redirectToFallbackAuthentication();
     }
   }, 600);
   ```

---

## 3. Desktop vs Mobile & Fallback Strategies

Because desktop environments cannot run mobile deep links (`truecallersdk://`), the following strategy is implemented:

| Platform | Authentication Flow | Fallback Flow (If Truecaller fails/absent) |
| :--- | :--- | :--- |
| **Mobile Web** | Direct Truecaller App Verification (Deep link) | Redirect user to standard **Email OTP** or **ID/Password** login. |
| **Desktop Web** | Bypass deep link; display standard **ID/Password** login & **Email OTP** fields. | Standard login/registration flows. |

> [!TIP]
> **VRIX Sandbox Testing:** Under sandbox mode (`TRUECALLER_SANDBOX_MODE=true`), you do not need to register on Truecaller Developer Portal. A beautiful mock Truecaller dialog will slide up, simulating the verification payload and registration/login pipeline instantly.

---

## 4. Brand Assets & Logo/Banner CDN URLs

When setting up your application interface in the Truecaller Developer Panel or Business Console:

1. **Logo / Icon Requirements:**
   - You must upload your own brand logo (recommended size: `512x512px` PNG with transparent background).
   - Once uploaded, Truecaller hosts this image on their secure Content Delivery Network (CDN), e.g., `https://business-priority-media-noneu.truecaller.com/your-media-path...`.
   
2. **Branding Banner (For Verified Business / Custom Overlays):**
   - If you want a custom header banner displayed when the Truecaller dialog overlays on mobile/web screens, navigate to **Verified Banners** inside the console and upload your design asset (recommended: `1080x450px`).
   - Truecaller automatically serves this optimized asset via their edge CDNs.

3. **Official Buttons:**
   - Avoid hardcoding static Truecaller button graphics. The SDK programmatically renders standard buttons to maintain compliance with Truecaller's visual brand standards.
   - For custom UI layouts, you can download verified vectors and assets directly from the official **[Truecaller Media Kit](https://www.truecaller.com/media-kit)**.

