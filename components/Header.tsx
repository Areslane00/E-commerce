"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Search, Sparkles, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

function SearchInput({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") || "");
  const { lang } = useLanguageStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/");
    }
    if (onClose) onClose();
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={
        isMobile
          ? "w-full flex items-center relative"
          : "hidden md:flex flex-1 max-w-md items-center relative"
      }
    >
      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 pointer-events-none" />
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder=""
        autoFocus={isMobile}
        className="w-full h-10 pl-9 rtl:pl-4 rtl:pr-9 pr-4 rounded-xl text-base sm:text-xs bg-zinc-100/80 dark:bg-zinc-900/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all text-foreground"
      />
    </form>
  );
}

export function Header() {
  const { openCart, getTotalItems } = useCartStore();
  const { lang } = useLanguageStore();
  const t = translations[lang];
  const [mounted, setMounted] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-amber-50/85 dark:bg-zinc-950/85 border-b border-amber-200/50 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center text-white dark:text-zinc-900 shadow-md group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 dark:text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              Ares<span className="text-emerald-500">Store</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">
              {mounted && lang === "ar" ? "متجر الجزائر" : "Algérie • 58 Wilayas"}
            </span>
          </div>
        </Link>

        {/* Desktop Search bar wrapped in Suspense */}
        <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md h-10" />}>
          <SearchInput />
        </Suspense>

        {/* Actions & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search toggle button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Rechercher"
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Language Toggle (FR / AR) */}
          <LanguageToggle />

          <ThemeToggle />

          {/* Cart Button with touch friendly padding */}
          <button
            onClick={openCart}
            aria-label="Ouvrir le panier"
            className="relative flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3.5 gap-1.5 sm:gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden md:inline">{mounted ? t.cart : "Panier"}</span>
            {mounted && totalItems > 0 && (
              <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-extrabold rounded-full bg-emerald-500 text-white shadow-sm animate-in zoom-in duration-200">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-amber-200/40 dark:border-zinc-850 bg-amber-50/95 dark:bg-zinc-950/95 animate-in slide-in-from-top-2 duration-200">
          <Suspense fallback={<div className="h-10" />}>
            <SearchInput isMobile onClose={() => setMobileSearchOpen(false)} />
          </Suspense>
        </div>
      )}
    </header>
  );
}
