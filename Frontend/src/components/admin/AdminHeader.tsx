"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  products: any[];
  orders: any[];
  customers: any[];
}

interface FlatResult {
  type: string;
  data: any;
}

interface AdminHeaderProps {
  adminName: string;
  adminAvatar: string;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onOpenModal: () => void;
  onLogout: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  isSearchLoading: boolean;
  searchResults: SearchResult;
  flatResults: FlatResult[];
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
  onLoadSearchData: () => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function AdminHeader({
  adminName,
  adminAvatar,
  isDropdownOpen,
  setIsDropdownOpen,
  onOpenModal,
  onLogout,
  dropdownRef,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  isSearchLoading,
  searchResults,
  flatResults,
  selectedIndex,
  setSelectedIndex,
  onLoadSearchData,
  searchContainerRef,
}: AdminHeaderProps) {
  const router = useRouter();

  const handleSelectResult = (item: FlatResult) => {
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
      setSelectedIndex((selectedIndex + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((selectedIndex - 1 + flatResults.length) % flatResults.length);
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

  return (
    <header className="h-16 bg-pure-white border-b border-slate-grey/20 flex items-center justify-between px-12 flex-shrink-0">
      {/* Search Bar */}
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
            onLoadSearchData();
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
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">Products</div>
                    {searchResults.products.map((p) => {
                      const flatIdx = flatResults.findIndex(x => x.type === "product" && x.data.id === p.id);
                      const isSelected = selectedIndex === flatIdx;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectResult({ type: "product", data: p })}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"}`}
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

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">Orders</div>
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
                          className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"}`}
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

                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey/75 bg-soft-linen/20 font-bold">Customers</div>
                    {searchResults.customers.map((c) => {
                      const flatIdx = flatResults.findIndex(x => x.type === "customer" && x.data.email === c.email);
                      const isSelected = selectedIndex === flatIdx;
                      return (
                        <div
                          key={c.email}
                          onClick={() => handleSelectResult({ type: "customer", data: c })}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${isSelected ? "bg-soft-linen/50 border-l-2 border-deep-navy" : "hover:bg-soft-linen/25"}`}
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

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        <button className="relative text-slate-grey hover:text-deep-navy transition-colors cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            notifications
          </span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-on-tertiary-container rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 border-l border-slate-grey/20 pl-6 focus:outline-none hover:opacity-85 transition-opacity cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-grey/20 bg-soft-linen relative flex-shrink-0">
              <Image alt="Admin Avatar" src={adminAvatar} fill sizes="32px" className="object-cover" priority />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-button text-button text-deep-navy text-sm font-semibold tracking-wide">{adminName}</span>
              <span className="text-[10px] text-slate-grey font-label-caps tracking-widest -mt-0.5">Administrator</span>
            </div>
            <span className={`material-symbols-outlined text-slate-grey text-xs transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}>
              keyboard_arrow_down
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-pure-white border border-slate-grey/25 shadow-xl py-2 z-50 animate-fade-in rounded-none">
              <div className="px-4 py-2 border-b border-slate-grey/10">
                <p className="font-body-md text-xs text-slate-grey uppercase tracking-widest">Signed in as</p>
                <p className="font-semibold text-deep-navy text-sm truncate">{adminName}</p>
              </div>
              <button
                onClick={onOpenModal}
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors font-medium group"
              >
                <span className="material-symbols-outlined text-sm text-red-600 group-hover:scale-110 transition-transform">logout</span>
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
