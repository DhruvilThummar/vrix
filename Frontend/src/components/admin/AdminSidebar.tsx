"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Products", href: "/admin/products", icon: "inventory_2" },
  { name: "Collections", href: "/admin/collections", icon: "category" },
  { name: "Orders", href: "/admin/orders", icon: "receipt_long" },
  { name: "Marketing", href: "/admin/marketing", icon: "confirmation_number" },
  { name: "CMS", href: "/admin/cms", icon: "article" },
  { name: "Homepage Layout", href: "/admin/homepage", icon: "view_quilt" },
  { name: "Navigation", href: "/admin/navigation", icon: "navigation" },
  { name: "Bespoke Configurator", href: "/admin/bespoke", icon: "diamond" },
  { name: "Media Library", href: "/admin/media", icon: "perm_media" },
  { name: "Delivery Staff", href: "/admin/delivery", icon: "local_shipping" },
  { name: "Security & Logs", href: "/admin/security", icon: "security" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
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
      <div className="p-4 border-t border-pure-white/20 flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-pure-white/70 hover:bg-pure-white/5 hover:text-pure-white transition-colors duration-300"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            storefront
          </span>
          <span className="font-button text-button text-sm">View Store</span>
        </Link>
        <button
          onClick={() => {
            logout();
            localStorage.removeItem("vrix_delivery_user");
            window.location.href = "/account";
          }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-DEFAULT text-rose-400 hover:bg-pure-white/5 hover:text-rose-300 transition-colors duration-300 text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-rose-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            logout
          </span>
          <span className="font-button text-button text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
