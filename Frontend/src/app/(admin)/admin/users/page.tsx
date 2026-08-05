"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchDb, getApiBaseUrl } from "@/utils/api";
import { useCurrency } from "@/utils/useCurrency";

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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<"ALL" | "VRIX_PLUS" | "REGULAR">("ALL");
  const [buyingFilter, setBuyingFilter] = useState<"ALL" | "HAS_BUYING" | "NO_BUYING">("ALL");

  // Custom Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected User Drawer
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/users`);
      if (!res.ok) throw new Error("Failed to fetch user directory.");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("User list error:", err);
      // Fallback local fetch
      try {
        const dbRes = await fetchDb();
        setUsers(Array.isArray(dbRes?.users) ? dbRes.users : []);
      } catch (e) {
        setError(err.message || "Failed to load user management records.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
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
  }, [users, searchQuery, memberFilter, buyingFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, memberFilter, buyingFilter, pageSize]);

  // Pagination calculation
  const totalRecords = filteredUsers.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="p-6 md:p-10 space-y-8 bg-soft-linen/10 min-h-screen text-ink-black">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/20 pb-6">
        <div>
          <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
            VRIX CMS Management
          </span>
          <h1 className="font-display-lg text-2xl md:text-3xl text-deep-navy uppercase tracking-wider">
            Customer Directory & Analytics
          </h1>
          <p className="font-body-md text-xs text-slate-grey mt-1">
            View registered user profiles, lifetime purchasing activity, cart contents, and membership status.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="self-start md:self-auto px-4 py-2.5 bg-black text-white text-xs font-button uppercase tracking-widest hover:bg-black/90 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Directory
        </button>
      </div>

      {/* Analytics Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Total Registered Users</span>
          <p className="font-display-lg text-2xl text-deep-navy mt-1">{users.length}</p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">VRIX+ Circle Members</span>
          <p className="font-display-lg text-2xl text-amber-700 mt-1">
            {users.filter((u) => u.isVrixPlusMember).length}
          </p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Total Customer Lifetime Revenue</span>
          <p className="font-display-lg text-2xl text-green-700 mt-1">
            {formatPrice(users.reduce((acc, u) => acc + (u.totalBuying || 0), 0))}
          </p>
        </div>
        <div className="bg-pure-white p-5 border border-slate-grey/20 shadow-xs">
          <span className="text-[10px] font-label-caps uppercase text-slate-grey tracking-widest block">Active Cart Users</span>
          <p className="font-display-lg text-2xl text-deep-navy mt-1">
            {users.filter((u) => (u.cartItemsCount || 0) > 0).length}
          </p>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-pure-white p-4 border border-slate-grey/20 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="w-full md:w-80 relative flex items-center border border-slate-grey/30 px-3 py-2 bg-soft-linen/20">
          <span className="material-symbols-outlined text-slate-grey mr-2 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search email, name, phone..."
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
            className="px-3 py-2 border border-slate-grey/30 font-label-caps text-xs uppercase bg-pure-white outline-none cursor-pointer"
          >
            <option value="ALL">All Membership Levels</option>
            <option value="VRIX_PLUS">VRIX+ Circle Only</option>
            <option value="REGULAR">Regular Users Only</option>
          </select>

          {/* Spending Filter */}
          <select
            value={buyingFilter}
            onChange={(e) => setBuyingFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-grey/30 font-label-caps text-xs uppercase bg-pure-white outline-none cursor-pointer"
          >
            <option value="ALL">All Purchase Levels</option>
            <option value="HAS_BUYING">Purchased Before</option>
            <option value="NO_BUYING">No Purchases Yet</option>
          </select>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 border-l border-slate-grey/20 pl-3">
            <span className="font-label-caps text-[10px] uppercase text-slate-grey">Show per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-grey/30 font-label-caps text-xs uppercase font-semibold bg-pure-white outline-none cursor-pointer"
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
      <div className="bg-pure-white border border-slate-grey/20 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-grey font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
            Loading Customer Directory...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-body-md text-xs">{error}</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-grey font-body-md text-sm">
            No customers match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soft-linen/40 border-b border-slate-grey/20 font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                  <th className="py-3.5 px-4 font-semibold">User / Email</th>
                  <th className="py-3.5 px-4 font-semibold">Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Membership</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Lifetime Buying</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Cart / Wishlist</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-grey/10 text-xs font-body-md">
                {paginatedUsers.map((user, idx) => (
                  <tr key={user.email + idx} className="hover:bg-soft-linen/15 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-deep-navy">{user.name || "Customer"}</div>
                      <div className="text-[11px] text-slate-grey">{user.email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-grey">
                      {user.phone || <span className="text-slate-grey/40">Not provided</span>}
                    </td>
                    <td className="py-4 px-4">
                      {user.isVrixPlusMember ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-label-caps bg-amber-50 text-amber-800 border border-amber-300/60 px-2 py-0.5 uppercase tracking-wider font-semibold">
                          ★ VRIX+ Member
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-grey uppercase font-label-caps">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-ink-black">
                      {formatPrice(user.totalBuying || 0)}
                      {user.totalOrdersCount ? (
                        <span className="block text-[10px] text-slate-grey font-normal">{user.totalOrdersCount} orders</span>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="bg-soft-linen px-2 py-1 text-[10px] font-label-caps text-deep-navy font-semibold">
                          👜 {user.cartItemsCount || 0}
                        </span>
                        <span className="bg-soft-linen px-2 py-1 text-[10px] font-label-caps text-deep-navy font-semibold">
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
                        className="px-3 py-1.5 border border-slate-grey/30 text-ink-black uppercase text-[10px] font-button hover:bg-black hover:text-white transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
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
              <span className="font-semibold text-ink-black">{totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-slate-grey/30 bg-pure-white text-ink-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                Previous
              </button>

              <span className="px-2 text-deep-navy font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-grey/30 bg-pure-white text-ink-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Slide-over Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-pure-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 z-10 border-l border-slate-grey/20">
            <div className="flex justify-between items-center border-b border-soft-linen pb-4">
              <h3 className="font-display-lg text-lg text-deep-navy uppercase">Customer Profile</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-grey hover:text-black">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-display-lg text-xl text-ink-black">{selectedUser.name || "Guest Customer"}</h4>
                <p className="font-body-md text-xs text-slate-grey">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="font-body-md text-xs text-slate-grey mt-0.5">Phone: {selectedUser.phone}</p>
                )}
              </div>

              <div className="p-4 bg-soft-linen/30 border border-slate-grey/15 space-y-2">
                <div className="flex justify-between text-xs font-label-caps">
                  <span className="text-slate-grey">Lifetime Spending:</span>
                  <span className="font-bold text-deep-navy">{formatPrice(selectedUser.totalBuying || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-label-caps">
                  <span className="text-slate-grey">Completed Orders:</span>
                  <span className="font-bold text-deep-navy">{selectedUser.totalOrdersCount || 0} orders</span>
                </div>
                <div className="flex justify-between text-xs font-label-caps">
                  <span className="text-slate-grey">VRIX+ Circle Status:</span>
                  <span className="font-bold text-amber-800">
                    {selectedUser.isVrixPlusMember ? "Active Member" : "Non-Member"}
                  </span>
                </div>
              </div>

              {/* Active Cart Section */}
              <div className="space-y-2 pt-2 border-t border-soft-linen">
                <h5 className="font-label-caps text-xs uppercase tracking-widest text-deep-navy">
                  Active Cart Items ({selectedUser.cartItemsCount || 0})
                </h5>
                {selectedUser.cartItems && selectedUser.cartItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.cartItems.map((item: any, i: number) => (
                      <div key={i} className="p-2.5 border border-soft-linen bg-surface/30 flex justify-between text-xs">
                        <div>
                          <p className="font-semibold text-deep-navy">{item.title}</p>
                          <p className="text-[10px] text-slate-grey">{item.material} • Size: {item.size || "Default"}</p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-grey font-body-md">Cart is currently empty.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
