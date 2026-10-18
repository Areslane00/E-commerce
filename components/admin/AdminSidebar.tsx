"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  LogOut,
  Sparkles,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";

interface AdminSidebarProps {
  isRealtimeConnected?: boolean;
}

export function AdminSidebar({ isRealtimeConnected = true }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      title: "Tableau de Bord",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Commandes",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Produits & Stock",
      href: "/admin/products",
      icon: Package,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                NOVA Admin
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                E-Commerce Manager
              </span>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        {/* Realtime Live Status Indicator */}
        <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-850/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 font-medium">Supabase Realtime</span>
          <div className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Connecté</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Store className="w-4 h-4 text-emerald-500" />
          <span>Voir la boutique</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
