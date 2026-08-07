"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { fetchUsers, updateUserVrixPlus, fetchDb } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";

interface UserRecord {
  email: string;
  name?: string;
  phone?: string;
  createdAt?: string;
  isVrixPlusMember?: boolean;
  vrixPlusJoinedDate?: string;
  totalBuying?: number;
  totalOrdersCount?: number;
  cartItemsCount?: number;
  wishlistItemsCount?: number;
  cartItems?: any[];
  wishlistItems?: any[];
}

export default function AdminUsersPage() {
  const { formatPrice } = useCurrency();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters, Search & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<"ALL" | "VRIX_PLUS" | "REGULAR">("ALL");
  const [buyingFilter, setBuyingFilter] = useState<"ALL" | "HAS_BUYING" | "NO_BUYING">("ALL");
  const [sortBy, setSortBy] = useState<"SPEND_DESC" | "SPEND_ASC" | "ORDERS_DESC" | "NEWEST">("SPEND_DESC");

  // Custom Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected User Drawer
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingVrixPlus, setUpdatingVrixPlus] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("User list error:", err);
      try {
        const dbRes = await fetchDb();
        setUsers(Array.isArray(dbRes?.users) ? dbRes.users : []);
      } catch (e) {
        setError(err.message || "Failed to load customer directory.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleVrixPlus = async (user: UserRecord) => {
    const nextState = !user.isVrixPlusMember;
    setUpdatingVrixPlus(true);
    try {
      await updateUserVrixPlus(user.email, nextState);
      setUsers((prev) =>
        prev.map((u) => (u.email === user.email ? { ...u, isVrixPlusMember: nextState } : u))
      );
      if (selectedUser?.email === user.email) {
        setSelectedUser((prev) => (prev ? { ...prev, isVrixPlusMember: nextState } : null));
      }
    } catch (err: any) {
      alert("Failed to update membership status: " + err.message);
    } finally {
      setUpdatingVrixPlus(false);
    }
  };

  // Filtered & Sorted dataset
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchMember =
        memberFilter === "ALL"
          ? true
          : memberFilter === "VRIX_PLUS"
          ? !!u.isVrixPlusMember
          : !u.isVrixPlusMember;

      const matchBuying =
        buyingFilter === "ALL"
          ? true
          : buyingFilter === "HAS_BUYING"
          ? (u.totalBuying || 0) > 0
          : (u.totalBuying || 0) === 0;

      return matchQuery && matchMember && matchBuying;
    });

    return list.sort((a, b) => {
      if (sortBy === "SPEND_DESC") return (b.totalBuying || 0) - (a.totalBuying || 0);
      if (sortBy === "SPEND_ASC") return (a.totalBuying || 0) - (b.totalBuying || 0);
      if (sortBy === "ORDERS_DESC") return (b.totalOrdersCount || 0) - (a.totalOrdersCount || 0);
      if (sortBy === "NEWEST") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return 0;
    });
  }, [users, searchQuery, memberFilter, buyingFilter, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, memberFilter, buyingFilter, sortBy, pageSize]);

  // Pagination calculation
  const totalRecords = filteredUsers.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Total In-Cart Revenue Sum
  const totalCartValueSum = useMemo(() => {
    return users.reduce((acc, u) => {
      if (!Array.isArray(u.cartItems)) return acc;
      const userCartSum = u.cartItems.reduce((cAcc: number, item: any) => cAcc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
      return acc + userCartSum;
    }, 0);
  }, [users]);

  return (
    <div className="p-6 md:p-10 space-y-8 bg-soft-linen/10 min-h-screen text-ink-black font-body-md">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/20 pb-6">
        <div>
          <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
            VRIX CMS Management
          </span>
          <h1 className="font-display-lg text-2xl md:text-3xl text-deep-navy uppercase tracking-wider">
            Customer Directory & Lifetime Analytics
          </h1>
          <p className="font-body-md text-xs text-slate-grey mt-1">
            View registered user profiles, lifetime purchasing activity, cart contents, and VIP membership status.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="self-start md:self-auto px-4 py-2.5 bg-deep-navy text-white text-xs font-button uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-sm rounded"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Directory
        </button>
      </div>

      {/* Analytics Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs rounded">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Total Registered Customers</span>
          <p className="font-display-lg text-2xl text-deep-navy mt-1">{users.length}</p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs rounded">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">VRIX+ VIP Circle Members</span>
          <p className="font-display-lg text-2xl text-amber-700 mt-1">
            {users.filter((u) => u.isVrixPlusMember).length}
          </p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs rounded">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Total Customer Revenue</span>
          <p className="font-display-lg text-2xl text-emerald-700 mt-1">
            {formatPrice(users.reduce((acc, u) => acc + (u.totalBuying || 0), 0))}
          </p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs rounded">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Active In-Cart Value</span>
          <p className="font-display-lg text-2xl text-deep-navy mt-1">
            {formatPrice(totalCartValueSum)}
          </p>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-pure-white p-4 border border-slate-grey/20 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between rounded">
        
        {/* Search */}
        <div className="w-full md:w-80 relative flex items-center border border-slate-grey/30 px-3 py-2 bg-soft-linen/20 rounded">
          <span className="material-symbols-outlined text-slate-grey mr-2 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search customer email, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none font-body-md text-xs text-ink-black"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-grey hover:text-ink-black">
              <span className="material-symbols-outlined text-[14px]">clear</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap gap-3 items-center">
          
          {/* Membership Filter */}
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-grey/30 font-label-caps text-xs uppercase bg-pure-white outline-none cursor-pointer rounded"
          >
            <option value="ALL">All Membership Levels</option>
            <option value="VRIX_PLUS">VRIX+ VIP Members</option>
            <option value="REGULAR">Regular Customers</option>
          </select>

          {/* Spending Filter */}
          <select
            value={buyingFilter}
            onChange={(e) => setBuyingFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-grey/30 font-label-caps text-xs uppercase bg-pure-white outline-none cursor-pointer rounded"
          >
            <option value="ALL">All Purchasing Levels</option>
            <option value="HAS_BUYING">Buyers Only (Has Orders)</option>
            <option value="NO_BUYING">Non-Buyers (0 Orders)</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-grey/30 font-label-caps text-xs uppercase bg-pure-white outline-none cursor-pointer rounded"
          >
            <option value="SPEND_DESC">Sort: Highest Spend</option>
            <option value="SPEND_ASC">Sort: Lowest Spend</option>
            <option value="ORDERS_DESC">Sort: Most Orders</option>
            <option value="NEWEST">Sort: Newest Registered</option>
          </select>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 border-l border-slate-grey/20 pl-3">
            <span className="font-label-caps text-[10px] uppercase text-slate-grey">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-grey/30 font-label-caps text-xs uppercase font-semibold bg-pure-white outline-none cursor-pointer rounded"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-pure-white border border-slate-grey/20 shadow-xs overflow-hidden rounded">
        {loading ? (
          <div className="p-12 text-center text-slate-grey font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
            Loading Customer Directory...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-body-md text-xs">{error}</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-grey font-body-md text-sm">
            No customer profiles match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soft-linen/40 border-b border-slate-grey/20 font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Phone</th>
                  <th className="py-3.5 px-4 font-semibold">VRIX+ VIP Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Cart / Wishlist</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-grey/10 text-xs font-body-md">
                {paginatedUsers.map((user, idx) => {
                  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

                  return (
                    <tr key={user.email + idx} className="hover:bg-soft-linen/15 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-deep-navy text-white flex items-center justify-center font-display-lg text-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-deep-navy">{user.name || "Guest Customer"}</div>
                            <div className="text-[11px] text-slate-grey">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-grey">
                        {user.phone || <span className="text-slate-grey/40 italic">Not provided</span>}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleVrixPlus(user)}
                          disabled={updatingVrixPlus}
                          className={`inline-flex items-center gap-1 text-[9px] font-label-caps px-2.5 py-1 uppercase tracking-wider font-bold rounded cursor-pointer transition-all ${
                            user.isVrixPlusMember
                              ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {user.isVrixPlusMember ? "★ VRIX+ Member" : "Standard User"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-ink-black">
                        <div className="text-sm font-semibold text-emerald-800">{formatPrice(user.totalBuying || 0)}</div>
                        <div className="text-[10px] text-slate-grey font-normal">{user.totalOrdersCount || 0} completed orders</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-label-caps rounded font-semibold ${user.cartItemsCount ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>
                            👜 {user.cartItemsCount || 0} in cart
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-label-caps rounded font-semibold ${user.wishlistItemsCount ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                            ♥ {user.wishlistItemsCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3.5 py-1.5 border border-deep-navy text-deep-navy uppercase text-[10px] font-button hover:bg-deep-navy hover:text-white transition-colors cursor-pointer rounded"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Custom Pagination Footer */}
        {!loading && totalRecords > 0 && (
          <div className="p-4 bg-soft-linen/20 border-t border-slate-grey/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-label-caps text-xs uppercase tracking-wider">
            <div className="text-slate-grey text-[11px]">
              Showing <span className="font-semibold text-ink-black">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-ink-black">{Math.min(currentPage * pageSize, totalRecords)}</span> of{" "}
              <span className="font-semibold text-ink-black">{totalRecords}</span> customers
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-slate-grey/30 bg-pure-white text-ink-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors cursor-pointer rounded"
              >
                Previous
              </button>

              <span className="px-2 text-deep-navy font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-grey/30 bg-pure-white text-ink-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors cursor-pointer rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile & Activity Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-pure-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 z-10 border-l border-slate-grey/20">
            <div className="flex justify-between items-center border-b border-soft-linen pb-4">
              <h3 className="font-display-lg text-lg text-deep-navy uppercase">Customer Profile Analytics</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-grey hover:text-black cursor-pointer p-1">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="p-4 bg-soft-linen/30 border border-slate-grey/20 rounded flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-deep-navy text-white flex items-center justify-center font-display-lg text-lg shrink-0">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display-lg text-lg text-ink-black">{selectedUser.name || "Guest Customer"}</h4>
                    <p className="font-body-md text-xs text-slate-grey">{selectedUser.email}</p>
                    {selectedUser.phone && (
                      <p className="font-body-md text-xs text-slate-grey mt-0.5">Phone: {selectedUser.phone}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleVrixPlus(selectedUser)}
                  disabled={updatingVrixPlus}
                  className={`text-[10px] font-label-caps px-3 py-1.5 rounded uppercase tracking-wider font-bold shadow-xs cursor-pointer transition-colors ${
                    selectedUser.isVrixPlusMember
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                  }`}
                >
                  {selectedUser.isVrixPlusMember ? "★ VRIX+ Member" : "Grant VRIX+"}
                </button>
              </div>

              {/* Financial & Activity Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded">
                  <span className="text-[9px] font-label-caps uppercase text-emerald-800 tracking-wider block font-semibold">Lifetime Purchasing</span>
                  <span className="font-display-lg text-xl text-emerald-900 mt-1 block">{formatPrice(selectedUser.totalBuying || 0)}</span>
                </div>
                <div className="p-3.5 bg-deep-navy/5 border border-deep-navy/20 rounded">
                  <span className="text-[9px] font-label-caps uppercase text-deep-navy tracking-wider block font-semibold">Completed Orders</span>
                  <span className="font-display-lg text-xl text-deep-navy mt-1 block">{selectedUser.totalOrdersCount || 0} orders</span>
                </div>
              </div>

              {/* Active Cart Breakdown */}
              <div className="space-y-3 pt-2 border-t border-soft-linen">
                <div className="flex items-center justify-between">
                  <h5 className="font-label-caps text-xs uppercase tracking-widest text-deep-navy font-bold">
                    Active Shopping Cart ({selectedUser.cartItemsCount || 0} items)
                  </h5>
                  {selectedUser.cartItems && selectedUser.cartItems.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-700">
                      Total: {formatPrice(selectedUser.cartItems.reduce((acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0))}
                    </span>
                  )}
                </div>

                {selectedUser.cartItems && selectedUser.cartItems.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {selectedUser.cartItems.map((item: any, i: number) => (
                      <div key={i} className="p-3 border border-slate-grey/20 rounded bg-pure-white flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="w-10 h-10 relative bg-soft-linen rounded overflow-hidden shrink-0">
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-deep-navy">{item.title}</p>
                            <p className="text-[10px] text-slate-grey">Qty: {item.quantity || 1} • {item.material || "Gold"} • Size: {item.size || "Standard"}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-800 shrink-0">{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-soft-linen/20 border border-slate-grey/15 rounded text-center text-xs text-slate-grey">
                    Cart is currently empty.
                  </div>
                )}
              </div>

              {/* Active Wishlist Breakdown */}
              <div className="space-y-3 pt-2 border-t border-soft-linen">
                <h5 className="font-label-caps text-xs uppercase tracking-widest text-deep-navy font-bold">
                  Saved Wishlist Items ({selectedUser.wishlistItemsCount || 0})
                </h5>
                {selectedUser.wishlistItems && selectedUser.wishlistItems.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {selectedUser.wishlistItems.map((item: any, i: number) => (
                      <div key={i} className="p-3 border border-slate-grey/20 rounded bg-pure-white flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="w-10 h-10 relative bg-soft-linen rounded overflow-hidden shrink-0">
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-deep-navy">{item.title}</p>
                            <p className="text-[10px] text-slate-grey">{item.material || "Jewelry"}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-deep-navy shrink-0">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-soft-linen/20 border border-slate-grey/15 rounded text-center text-xs text-slate-grey">
                    Wishlist is currently empty.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

