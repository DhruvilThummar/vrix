"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchProducts, fetchPaymentLogs, fetchUsers } from "@/utils/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminProfileModal from "@/components/admin/AdminProfileModal";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Load admin profile from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("vrix_admin_name");
    const savedAvatar = localStorage.getItem("vrix_admin_avatar");
    if (savedName) setAdminName(savedName);
    if (savedAvatar) setAdminAvatar(savedAvatar);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Compile unique customers from users + orders
  const customers = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone?: string; type: "registered" | "guest" }>();
    usersCache.forEach(u => {
      if (u.email) {
        map.set(u.email.toLowerCase(), { name: u.name || "Unnamed", email: u.email, phone: u.phone, type: "registered" });
      }
    });
    ordersCache.forEach(o => {
      if (o.userEmail) {
        const emailKey = o.userEmail.toLowerCase();
        if (!map.has(emailKey)) {
          map.set(emailKey, { name: o.customerName || "Guest Buyer", email: o.userEmail, phone: o.customerPhone, type: "guest" });
        } else {
          const existing = map.get(emailKey)!;
          if (existing.name === "Unnamed" && o.customerName) existing.name = o.customerName;
          if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
        }
      }
    });
    return Array.from(map.values());
  }, [usersCache, ordersCache]);

  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { products: [], orders: [], customers: [] };
    return {
      products: productsCache.filter(p =>
        p.title?.toLowerCase().includes(q) || p.collection?.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q)
      ).slice(0, 5),
      orders: ordersCache.filter(o =>
        o.orderId?.toLowerCase().includes(q) || o.paymentId?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q)
      ).slice(0, 5),
      customers: customers.filter(c =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
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

  const handleLogout = () => {
    logout();
    localStorage.removeItem("vrix_delivery_user");
    setIsDropdownOpen(false);
    setIsSearchFocused(false);
    setSearchQuery("");
    router.replace("/account");
  };

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
