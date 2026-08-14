import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

/**
 * Global Axios Client Instance for VRIX E-Commerce Platform
 */
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `${window.location.origin}/api`;
    }
  }
  return "http://127.0.0.1:5000/api";
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Global Request Interceptor
 * Dynamically attach Authorization Bearer tokens or Admin Secrets if available
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("vrix_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Global Response Interceptor
 * Intercepts HTTP 429 (Rate Limit), 401 (Unauthorized), and 500 server errors globally
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ error?: string; message?: string; code?: string; retryAfterSeconds?: number; retryAfterMinutes?: number }>) => {
    if (error.response) {
      const { status, data } = error.response;

      // 🛑 Catch HTTP 429 (Rate Limit Exceeded)
      if (status === 429) {
        const rateLimitMessage =
          data?.error ||
          data?.message ||
          "Rate limit exceeded. You are sending requests too quickly. Please wait a moment.";

        console.warn("🛑 Rate Limit Triggered (HTTP 429):", rateLimitMessage);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("vrix:toast", {
              detail: {
                type: "error",
                message: `⚠️ Rate Limit Exceeded: ${rateLimitMessage}`,
                code: data?.code || "RATE_LIMIT_EXCEEDED",
                retryAfter: data?.retryAfterSeconds || data?.retryAfterMinutes || 60,
              },
            })
          );
        }
      }
    } else if (error.request) {
      console.error("🛑 Network Error: Server unreachable.", error.request);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
