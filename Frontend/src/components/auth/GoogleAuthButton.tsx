"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginWithGoogle } from "@/utils/api";

interface GoogleAuthButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (msg: string) => void;
  joinVrixPlus?: boolean;
  buttonText?: string;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  joinVrixPlus = false,
  buttonText = "Continue with Google",
  className = "",
}: GoogleAuthButtonProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response || !response.credential) {
        if (onError) onError("Failed to get Google authorization credentials.");
        return;
      }

      setLoading(true);
      try {
        const res = await loginWithGoogle({
          credential: response.credential,
          joinVrixPlus,
        });

        if (res.success && res.user) {
          login(res.user.email, {
            name: res.user.name,
            phone: res.user.phone,
            isVrixPlusMember: res.user.isVrixPlusMember,
            vrixPlusJoinedDate: res.user.vrixPlusJoinedDate,
          });
          if (onSuccess) onSuccess(res.user);
        } else {
          throw new Error("Google authentication failed.");
        }
      } catch (err: any) {
        console.error("Google Auth error:", err);
        if (onError) onError(err.message || "Google Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [login, joinVrixPlus, onSuccess, onError]
  );

  useEffect(() => {
    const existingScript = document.getElementById("google-gsi-script");

    const initializeGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn("Google GSI init warning:", e);
        }
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleGSI();
      };
      document.body.appendChild(script);
    } else {
      initializeGoogleGSI();
    }
  }, [googleClientId, handleCredentialResponse]);

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      if (onError) onError("Google Sign-In initializing... Please try again.");
    }
  };


  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={loading}
      className={`w-full py-3 px-4 border border-slate-grey/30 bg-pure-white hover:bg-slate-50 text-ink-black text-xs font-button uppercase tracking-wider flex items-center justify-center gap-3 transition-colors cursor-pointer rounded-xs shadow-2xs ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.05.0 12s.46 3.8 1.27 5.42l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
