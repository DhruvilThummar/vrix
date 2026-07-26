"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginWithGoogle } from "@/utils/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [statusMsg, setStatusMsg] = useState("Verifying Google Authentication...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(search);

        const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
        let userEmail = searchParams.get("email") || hashParams.get("email");
        let userName = searchParams.get("name") || hashParams.get("name");

        // Decode JWT payload if access token is present
        if (accessToken && !userEmail) {
          try {
            const parts = accessToken.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              userEmail = payload.email || payload.user_metadata?.email;
              userName = payload.user_metadata?.full_name || payload.name || payload.user_metadata?.name;
            }
          } catch (e) {
            console.warn("Error parsing callback token:", e);
          }
        }

        // Fallback email/name if not extracted from hash
        const targetEmail = userEmail || "google.user@vrix.com";
        const targetName = userName || (userEmail ? userEmail.split("@")[0] : "Google User");

        setStatusMsg("Finalizing session with VRIX...");
        const res = await loginWithGoogle({
          credential: accessToken || undefined,
          email: targetEmail,
          name: targetName
        });

        if (res && res.user) {
          login(res.user.email, {
            name: res.user.name,
            phone: res.user.phone || "",
            isVrixPlusMember: !!res.user.isVrixPlusMember
          });
          setStatusMsg("Success! Redirecting to account...");
          setTimeout(() => {
            router.replace("/account");
          }, 800);
        } else {
          throw new Error("Failed to authenticate Google user record.");
        }
      } catch (err: any) {
        console.error("Auth Callback Error:", err);
        setError(err.message || "Google Authentication callback failed.");
      }
    }

    handleCallback();
  }, [login, router]);

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-pure-white border border-slate-grey/20 p-8 shadow-xl text-center space-y-6">
        <div className="w-12 h-12 bg-deep-navy/10 text-deep-navy rounded-full flex items-center justify-center mx-auto">
          {error ? (
            <span className="material-symbols-outlined text-2xl text-red-600">error</span>
          ) : (
            <span className="w-6 h-6 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div>
          <h2 className="font-display-lg text-lg text-deep-navy uppercase tracking-widest">
            {error ? "Authentication Issue" : "Google Authentication"}
          </h2>
          <p className="text-xs text-slate-grey mt-2 font-body-md">
            {error || statusMsg}
          </p>
        </div>

        {error && (
          <button
            onClick={() => router.replace("/account")}
            className="w-full py-3 bg-deep-navy text-white text-xs font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
          >
            Return to Account Sign In
          </button>
        )}
      </div>
    </div>
  );
}
