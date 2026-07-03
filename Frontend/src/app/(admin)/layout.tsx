"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { uploadMedia, fetchProducts, fetchPaymentLogs, fetchUsers } from "@/utils/api";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [adminName, setAdminName] = useState("Admin User");
  const [adminAvatar, setAdminAvatar] = useState(DEFAULT_AVATAR);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [productsCache, setProductsCache] = useState<any[]>([]);
  const [ordersCache, setOrdersCache] = useState<any[]>([]);
  const [usersCache, setUsersCache] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load Search Data
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

  // Compile unique customers
  const customers = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone?: string; type: "registered" | "guest" }>();
    
    usersCache.forEach(u => {
      if (u.email) {
        map.set(u.email.toLowerCase(), {
          name: u.name || "Unnamed",
          email: u.email,
          phone: u.phone,
          type: "registered"
        });
      }
    });

    ordersCache.forEach(o => {
      if (o.userEmail) {
        const emailKey = o.userEmail.toLowerCase();
        if (!map.has(emailKey)) {
          map.set(emailKey, {
            name: o.customerName || "Guest Buyer",
            email: o.userEmail,
            phone: o.customerPhone,
            type: "guest"
          });
        } else {
          const existing = map.get(emailKey)!;
          if (existing.name === "Unnamed" && o.customerName) existing.name = o.customerName;
          if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
        }
      }
    });

    return Array.from(map.values());
  }, [usersCache, ordersCache]);

  // Search Results
  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { products: [], orders: [], customers: [] };

    const filteredProducts = productsCache.filter(p => 
      p.title?.toLowerCase().includes(q) ||
      p.collection?.toLowerCase().includes(q) ||
      p.material?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q)
    ).slice(0, 5);

    const filteredOrders = ordersCache.filter(o => 
      o.orderId?.toLowerCase().includes(q) ||
      o.paymentId?.toLowerCase().includes(q) ||
      o.userEmail?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    ).slice(0, 5);

    const filteredCustomers = customers.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    ).slice(0, 5);

    return {
      products: filteredProducts,
      orders: filteredOrders,
      customers: filteredCustomers
    };
  }, [searchQuery, productsCache, ordersCache, customers]);

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    const list: any[] = [];
    searchResults.products.forEach(p => list.push({ type: "product", data: p }));
    searchResults.orders.forEach(o => list.push({ type: "order", data: o }));
    searchResults.customers.forEach(c => list.push({ type: "customer", data: c }));
    return list;
  }, [searchResults]);

  const handleSelectResult = (item: { type: string; data: any }) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setSelectedIndex(-1);
    if (item.type === "product") {
      router.push(`/admin/products?id=${item.data.id}`);
    } else if (item.type === "order") {
      router.push(`/admin/orders?id=${item.data.orderId}`);
    } else if (item.type === "customer") {
      router.push(`/admin/orders?search=${encodeURIComponent(item.data.email)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        handleSelectResult(flatResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      setSelectedIndex(-1);
    }
  };

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Modal Temp Form States
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load from localStorage on mount
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenModal = () => {
    setTempName(adminName);
    setTempAvatar(adminAvatar);
    setUploadError(null);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    
    setAdminName(tempName);
    setAdminAvatar(tempAvatar || DEFAULT_AVATAR);
    localStorage.setItem("vrix_admin_name", tempName);
    localStorage.setItem("vrix_admin_avatar", tempAvatar || DEFAULT_AVATAR);
    setIsModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadMedia(files[0]);
      setTempAvatar(res.url);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "dashboard" },
    { name: "Products", href: "/admin/products", icon: "inventory_2" },
    { name: "Collections", href: "/admin/collections", icon: "category" },
    { name: "Orders", href: "/admin/orders", icon: "receipt_long" },
    { name: "Marketing", href: "/admin/marketing", icon: "confirmation_number" },
    { name: "CMS", href: "/admin/cms", icon: "article" },
    { name: "Delivery Staff", href: "/admin/delivery", icon: "local_shipping" },
    { name: "Security & Logs", href: "/admin/security", icon: "security" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-soft-linen">
      {/* Sidebar */}
      <aside className="w-64 bg-deep-navy text-pure-white flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-pure-white/20">
          <Link href="/admin" className="font-display-lg text-headline-md tracking-widest text-pure-white flex items-center gap-2">
            VRIX <span className="text-xs uppercase font-label-caps text-slate-grey">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-DEFAULT transition-colors duration-300 ${
                  isActive
                    ? "bg-pure-white/10 text-pure-white"
                    : "text-pure-white/70 hover:bg-pure-white/5 hover:text-pure-white"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                  {item.icon}
                </span>
                <span className="font-button text-button text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-pure-white/20">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-pure-white/70 hover:bg-pure-white/5 hover:text-pure-white transition-colors duration-300"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              storefront
            </span>
            <span className="font-button text-button text-sm">View Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-pure-white border-b border-slate-grey/20 flex items-center justify-between px-12 flex-shrink-0">
          <div className="flex items-center w-96 relative" ref={searchContainerRef}>
            <span className="material-symbols-outlined text-slate-grey mr-2" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              search
            </span>
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-body-md placeholder-slate-grey font-body-md outline-none"
              placeholder="Search orders, products, or customers..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => {
                setIsSearchFocused(true);
                loadSearchData();
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Autocomplete Dropdown */}
            {isSearchFocused && (searchQuery.trim().length > 0 || isSearchLoading) && (
              <div className="absolute left-0 top-12 w-full bg-pure-white border border-slate-grey/25 shadow-2xl z-50 max-h-[480px] overflow-y-auto rounded-none animate-fade-in flex flex-col divide-y divide-slate-grey/10">
                {isSearchLoading ? (
                  <div className="p-6 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin"></div>
                    Searching database...
                  </div>
                ) : flatResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-grey">
                    <span className="material-symbols-outlined text-2xl mb-1">search_off</span>
                    <p className="text-xs font-label-caps uppercase tracking-widest">No matches found</p>
                    <p className="text-[10px] text-slate-grey/70 mt-1">Try searching for products, status, order IDs, or customer email</p>
                  </div>
                ) : (
                  <>
                    {/* Products Category */}
                    {searchResults.products.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">
                          Products
                        </div>
                        {searchResults.products.map((p) => {
                          const flatIdx = flatResults.findIndex(x => x.type === "product" && x.data.id === p.id);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleSelectResult({ type: "product", data: p })}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                                isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"
                              }`}
                            >
                              <div className="w-8 h-10 relative bg-soft-linen shrink-0 border border-slate-grey/10">
                                <Image src={p.image} alt={p.title} fill className="object-cover mix-blend-multiply animate-fade-in" sizes="32px" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-body-md text-ink-black truncate font-semibold">{p.title}</p>
                                <p className="text-[9px] text-slate-grey font-label-caps uppercase tracking-wider">{p.collection} · {p.type}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-deep-navy">${p.price}</p>
                                <p className={`text-[8px] font-label-caps uppercase ${p.stock === 0 ? "text-red-600 font-bold" : "text-slate-grey"}`}>
                                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Orders Category */}
                    {searchResults.orders.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">
                          Orders
                        </div>
                        {searchResults.orders.map((o) => {
                          const flatIdx = flatResults.findIndex(x => x.type === "order" && x.data.orderId === o.orderId);
                          const isSelected = selectedIndex === flatIdx;
                          const badgeClass =
                            o.status === "SUCCESS"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : o.status === "DELIVERED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : o.status === "FAILED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200";
                          return (
                            <div
                              key={o.orderId}
                              onClick={() => handleSelectResult({ type: "order", data: o })}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                                isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-body-md text-ink-black font-bold truncate">{o.orderId}</p>
                                <p className="text-[9px] text-slate-grey truncate">{o.userEmail || o.customerName || "Anonymous"}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                                <span className={`text-[8px] font-label-caps uppercase tracking-widest px-1.5 py-0.5 border ${badgeClass}`}>
                                  {o.status === "SUCCESS" ? "Paid" : o.status}
                                </span>
                                <p className="text-xs font-semibold text-ink-black">{o.currency} {o.amount.toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Customers Category */}
                    {searchResults.customers.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">
                          Customers
                        </div>
                        {searchResults.customers.map((c) => {
                          const flatIdx = flatResults.findIndex(x => x.type === "customer" && x.data.email === c.email);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <div
                              key={c.email}
                              onClick={() => handleSelectResult({ type: "customer", data: c })}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                                isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-body-md text-ink-black font-semibold truncate">{c.name}</p>
                                <p className="text-[9px] text-slate-grey truncate">{c.email}</p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <span className={`text-[8px] font-label-caps uppercase tracking-widest px-1.5 py-0.5 border ${
                                  c.type === "registered" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}>
                                  {c.type}
                                </span>
                                {c.phone && <p className="text-[8px] text-slate-grey/80 mt-1">{c.phone}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-grey hover:text-deep-navy transition-colors cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                notifications
              </span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-on-tertiary-container rounded-full"></span>
            </button>
            
            {/* Interactive User Panel */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 border-l border-slate-grey/20 pl-6 focus:outline-none hover:opacity-85 transition-opacity cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-grey/20 bg-soft-linen relative flex-shrink-0">
                  <Image
                    alt="Admin Avatar"
                    src={adminAvatar}
                    fill
                    sizes="32px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="font-button text-button text-deep-navy text-sm font-semibold tracking-wide">
                    {adminName}
                  </span>
                  <span className="text-[10px] text-slate-grey font-label-caps tracking-widest -mt-0.5">
                    Administrator
                  </span>
                </div>
                <span className={`material-symbols-outlined text-slate-grey text-xs transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  keyboard_arrow_down
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-pure-white border border-slate-grey/25 shadow-xl py-2 z-50 animate-fade-in rounded-none">
                  <div className="px-4 py-2 border-b border-slate-grey/10">
                    <p className="font-body-md text-xs text-slate-grey uppercase tracking-widest">Signed in as</p>
                    <p className="font-semibold text-deep-navy text-sm truncate">{adminName}</p>
                  </div>
                  <button
                    onClick={handleOpenModal}
                    className="w-full text-left px-4 py-2 text-sm text-deep-navy hover:bg-soft-linen/30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    <span>Edit Profile Settings</span>
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 text-sm text-deep-navy hover:bg-soft-linen/30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">storefront</span>
                    <span>View Storefront</span>
                  </Link>
                  <div className="border-t border-slate-grey/10 my-1"></div>
                  <button
                    onClick={() => {
                      alert("Admin logout simulated.");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/5 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto bg-soft-linen">
          {children}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-deep-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-pure-white border border-slate-grey/20 max-w-md w-full shadow-2xl p-8 space-y-6 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
              <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                Admin Profile Settings
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-grey hover:text-deep-navy transition-colors focus:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Preview & Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-deep-navy shadow relative group bg-soft-linen">
                  <Image
                    alt="New Avatar Preview"
                    src={tempAvatar || DEFAULT_AVATAR}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-deep-navy/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-pure-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                <div className="w-full">
                  <label className="block text-center font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-2">
                    Profile Photo Source
                  </label>
                  <div className="flex gap-2 justify-center">
                    <label className="border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white px-4 py-2 text-[10px] font-button uppercase tracking-wider transition-colors cursor-pointer text-center flex-1">
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadError && (
                    <p className="text-[10px] text-error mt-1 text-center font-body-md">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    required
                    className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black w-full"
                    placeholder="Enter admin name"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={tempAvatar}
                    onChange={(e) => setTempAvatar(e.target.value)}
                    className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black w-full text-xs"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="font-button text-xs uppercase px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex-1 flex items-center justify-center"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="font-button text-xs uppercase px-6 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

