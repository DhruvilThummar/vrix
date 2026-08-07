"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchProducts, fetchPaymentLogs, fetchUsers } from "@/utils/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminProfileModal from "@/components/admin/AdminProfileModal";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ── Admin-specific Auth State (completely separate from customer auth) ──
  const [adminUser, setAdminUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Profile State
  const [adminName, setAdminName] = useState("Admin User");
  const [adminAvatar, setAdminAvatar] = useState(DEFAULT_AVATAR);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [productsCache, setProductsCache] = useState<any[]>([]);
  const [ordersCache, setOrdersCache] = useState<any[]>([]);
  const [usersCache, setUsersCache] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ── Check vrix-admin-token on mount ──────────────────────────────────────
  useEffect(() => {
    // If on the login page, don't run guard
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      return;
    }

    try {
      const stored = localStorage.getItem("vrix-admin-token");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === "admin") {
          setAdminUser(parsed);
          // Load display name/avatar
          const savedName = localStorage.getItem("vrix_admin_name");
          const savedAvatar = localStorage.getItem("vrix_admin_avatar");
          if (savedName) setAdminName(savedName);
          else if (parsed.name) setAdminName(parsed.name);
          if (savedAvatar) setAdminAvatar(savedAvatar);
          setCheckingAuth(false);
          return;
        }
      }
    } catch {}

    // Not authenticated as admin → redirect to admin login
    router.replace("/admin/login");
    setCheckingAuth(false);
  }, [pathname, router]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadSearchData = async () => {
    if (productsCache.length > 0) return;
    setIsSearchLoading(true);
    try {
      const [prods, ords, users] = await Promise.all([
        fetchProducts().catch(() => []),
        fetchPaymentLogs().catch(() => []),
        fetchUsers().catch(() => []),
      ]);
      setProductsCache(prods || []);
      setOrdersCache(ords || []);
      setUsersCache(users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const customers = React.useMemo(() =>
    usersCache.map((u: any) => ({
      name: u.name || u.email,
      email: u.email,
      orders: ordersCache.filter((o: any) => o.userEmail === u.email).length,
    })),
    [usersCache, ordersCache]
  );

  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { products: [], orders: [], customers: [] };
    return {
      products: productsCache.filter((p: any) =>
        p.title?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q)
      ).slice(0, 5),
      orders: ordersCache.filter((o: any) =>
        o.orderId?.toLowerCase().includes(q) || o.userEmail?.toLowerCase().includes(q)
      ).slice(0, 5),
      customers: customers.filter((c: any) =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      ).slice(0, 5),
    };
  }, [searchQuery, productsCache, ordersCache, customers]);

  const flatResults = React.useMemo(() => {
    const list: any[] = [];
    searchResults.products.forEach(p => list.push({ type: "product", data: p }));
    searchResults.orders.forEach(o => list.push({ type: "order", data: o }));
    searchResults.customers.forEach(c => list.push({ type: "customer", data: c }));
    return list;
  }, [searchResults]);

  const handleSaveProfile = (name: string, avatar: string) => {
    setAdminName(name);
    setAdminAvatar(avatar);
    localStorage.setItem("vrix_admin_name", name);
    localStorage.setItem("vrix_admin_avatar", avatar);
    setIsModalOpen(false);
  };

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const { fetchNotifications } = await import("@/utils/api");
      const list = await fetchNotifications();
      if (Array.isArray(list)) {
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => !n.isRead).length);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    if (pathname === "/admin/login") return;
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [pathname]);

  const handleMarkRead = async (id: string) => {
    try {
      const { markNotificationRead } = await import("@/utils/api");
      await markNotificationRead(id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { markAllNotificationsRead } = await import("@/utils/api");
      await markAllNotificationsRead();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      const { clearAllNotifications } = await import("@/utils/api");
      await clearAllNotifications();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vrix-admin-token");
    localStorage.removeItem("vrix_admin_name");
    localStorage.removeItem("vrix_admin_avatar");
    localStorage.removeItem("vrix_delivery_user");
    setAdminUser(null);
    setIsDropdownOpen(false);
    setIsSearchFocused(false);
    setSearchQuery("");
    router.replace("/admin/login");
  };

  // ── If on login page, render children directly (no sidebar/header) ───────
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // ── Loading / not authenticated ───────────────────────────────────────────
  if (checkingAuth || !adminUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0c14] gap-4 text-white/40 text-xs tracking-widest">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        Authenticating Administrator...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-soft-linen">
      <AdminSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader
          adminName={adminName}
          adminAvatar={adminAvatar}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          onOpenModal={() => { setIsModalOpen(true); setIsDropdownOpen(false); }}
          onLogout={handleLogout}
          dropdownRef={dropdownRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchFocused={isSearchFocused}
          setIsSearchFocused={setIsSearchFocused}
          isSearchLoading={isSearchLoading}
          searchResults={searchResults}
          flatResults={flatResults}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          onLoadSearchData={loadSearchData}
          searchContainerRef={searchContainerRef}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />

        <div className="flex-1 overflow-y-auto bg-soft-linen">
          {children}
        </div>
      </div>

      <AdminProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProfile}
        initialName={adminName}
        initialAvatar={adminAvatar}
      />
    </div>
  );
}

