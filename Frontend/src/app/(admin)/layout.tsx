"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "dashboard" },
    { name: "Products", href: "/admin/products", icon: "inventory_2" },
    { name: "Orders", href: "/admin/orders", icon: "receipt_long" },
    { name: "CMS", href: "/admin/cms", icon: "article" },
    { name: "Marketing", href: "/admin/marketing", icon: "campaign" },
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
                <span className="font-button text-button">{item.name}</span>
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
            <span className="font-button text-button">View Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-pure-white border-b border-slate-grey/20 flex items-center justify-between px-margin-desktop flex-shrink-0">
          <div className="flex items-center w-96">
            <span className="material-symbols-outlined text-slate-grey mr-2" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              search
            </span>
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-body-md placeholder-slate-grey font-body-md outline-none"
              placeholder="Search orders, products, or customers..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-grey hover:text-deep-navy transition-colors cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                notifications
              </span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-on-tertiary-container rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-grey/20 pl-6">
              <Image
                alt="Admin Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-button text-button text-deep-navy">Admin User</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto bg-soft-linen">
          {children}
        </div>
      </div>
    </div>
  );
}
