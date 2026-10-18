"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Search, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") || "");
  const { lang } = useLanguageStore();
  const t = translations[lang];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/");
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="hidden md:flex flex-1 max-w-md items-center relative"
    >
      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 pointer-events-none" />
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder=""
        className="w-full h-10 pl-9 rtl:pl-4 rtl:pr-9 pr-4 rounded-xl text-xs bg-zinc-100/80 dark:bg-zinc-900/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all text-foreground"
      />
    </form>
  );
}

export function Header() {
  const { openCart, getTotalItems } = useCartStore();
  const { lang } = useLanguageStore();
  const t = translations[lang];
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-amber-50/75 dark:bg-zinc-950/80 border-b border-amber-200/50 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center text-white dark:text-zinc-900 shadow-md group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-amber-300 dark:text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              Ares<span className="text-emerald-500">Store</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">
              {mounted && lang === "ar" ? "متجر الجزائر" : "Algérie • 58 Wilayas"}
            </span>
          </div>
        </Link>

        {/* Search bar wrapped in Suspense */}
        <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md h-10" />}>
          <SearchInput />
        </Suspense>

        {/* Actions & Navigation */}
        <div className="flex items-center gap-2">
          {/* Language Toggle (FR / AR) */}
          <LanguageToggle />

          <ThemeToggle />

          {/* Cart Button */}
          <button
            onClick={openCart}
            aria-label="Ouvrir le panier"
            className="relative flex items-center justify-center h-10 px-3.5 gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{mounted ? t.cart : "Panier"}</span>
            {mounted && totalItems > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-extrabold rounded-full bg-emerald-500 text-white shadow-sm animate-in zoom-in duration-200">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
