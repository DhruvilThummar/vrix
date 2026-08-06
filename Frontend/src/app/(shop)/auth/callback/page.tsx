"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account");
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-pure-white border border-slate-grey/20 p-8 shadow-xl text-center space-y-4">
        <div className="w-6 h-6 border-2 border-deep-navy border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-grey font-body-md">Redirecting to account...</p>
      </div>
    </div>
  );
}
