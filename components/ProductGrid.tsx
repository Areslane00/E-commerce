"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "./ui/Skeleton";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import { Search, SlidersHorizontal, RefreshCw, PackageOpen } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  initialSearch?: string;
}

export function ProductGrid({
  products,
  isLoading = false,
  initialSearch = "",
}: ProductGridProps) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";
  const t = translations[mounted ? lang : "fr"];

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "all" ||
          product.category.toLowerCase() === selectedCategory.toLowerCase();

        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          product.category.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        // RÈGLE : Les produits dont le stock est disponible s'affichent TOUJOURS en premier
        const aInStock = (a.stock > 0) ? 1 : 0;
        const bInStock = (b.stock > 0) ? 1 : 0;
        if (aInStock !== bInStock) {
          return bInStock - aInStock; // Les produits disponibles (1) avant les épuisés (0)
        }

        // Si l'utilisateur choisit les promotions en premier
        if (sortBy === "promo") {
          const aPromo = (a.original_price && a.original_price > a.price) ? 1 : 0;
          const bPromo = (b.original_price && b.original_price > b.price) ? 1 : 0;
          if (aPromo !== bPromo) return bPromo - aPromo;
        }

        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "stock-desc") return b.stock - a.stock;
        return 0; // default order
      });
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between bg-amber-50/60 dark:bg-zinc-900/50 p-3 sm:p-4 rounded-2xl border border-amber-200/50 dark:border-zinc-800/80 backdrop-blur-sm">
        {/* Search input with empty placeholder as requested */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=""
            className="w-full h-10 pl-9 rtl:pl-4 rtl:pr-9 pr-4 rounded-xl text-base sm:text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs text-zinc-700 dark:text-zinc-300 flex-1 sm:flex-initial">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none text-base sm:text-xs font-medium cursor-pointer"
            >
              <option value="default">{isAr ? "الترتيب الافتراضي (المتوفر أولاً)" : "Tri par défaut (En stock d'abord)"}</option>
              <option value="promo">{isAr ? "العروض والتخفيضات أولاً" : "Promotions d'abord"}</option>
              <option value="price-asc">{isAr ? "السعر: من الأقل إلى الأعلى" : "Prix croissant"}</option>
              <option value="price-desc">{isAr ? "السعر: من الأعلى إلى الأقل" : "Prix décroissant"}</option>
              <option value="stock-desc">{isAr ? "الأكثر توفراً في المخزون" : "Quantité en stock"}</option>
            </select>
          </div>

          {(search || selectedCategory !== "all" || sortBy !== "default") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setSortBy("default");
              }}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "إعادة ضبط" : "Réinitialiser"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills with native mobile horizontal swipe */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              selectedCategory.toLowerCase() === category.toLowerCase()
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md"
                : "bg-amber-100/60 text-zinc-600 hover:bg-amber-200/80 dark:bg-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {category === "all" ? t.allCategories : category}
          </button>
        ))}
      </div>

      {/* Grid or Skeletons - 2 columns on mobile, 4 columns on desktop */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 sm:gap-3 rounded-2xl p-2.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-5 sm:h-6 w-14 sm:w-20 rounded-md" />
                <Skeleton className="h-8 sm:h-9 w-16 sm:w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-amber-50/40 dark:bg-zinc-900/30">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
            <PackageOpen className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {isAr ? "لم يتم العثور على أي منتج" : "Aucun produit trouvé"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
            {isAr
              ? "لا يوجد أي منتج يطابق معايير البحث أو القسم المحدد."
              : "Aucun article ne correspond à vos critères de recherche ou de filtre actuels."}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            {isAr ? "عرض جميع المنتجات" : "Voir tous les produits"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
