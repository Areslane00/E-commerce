"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Plus, Minus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();
  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";
  const { success, error } = useToast();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 5;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const res = addItem(product, quantity);
    if (res.success) {
      success(
        isAr
          ? `تمت إضافة ${quantity} x "${product.name}" إلى السلة`
          : `${quantity} x "${product.name}" ajouté${quantity > 1 ? "s" : ""} au panier.`,
        isAr ? "تم التحديث" : "Panier mis à jour"
      );
      openCart();
    } else {
      error(res.message, isAr ? "تنبيه" : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock Status Badge */}
      <div className="flex items-center gap-3">
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
            <XCircle className="w-4 h-4" />
            <span>{isAr ? "نفذت الكمية (غير متوفر)" : "Rupture de stock (Terminé)"}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>
              {isAr
                ? `متوفر في المخزون (${product.stock} قطعة)`
                : `En stock (${product.stock} unité${product.stock > 1 ? "s" : ""} disponible${product.stock > 1 ? "s" : ""})`}
            </span>
          </div>
        )}

        {isLowStock && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? "كمية محدودة جداً !" : "Stock limité !"}</span>
          </div>
        )}
      </div>

      {/* Quantity Selector & Add to Cart Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Quantity control */}
        <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 bg-zinc-50/50 dark:bg-zinc-900/50 w-full sm:w-40 min-h-[48px]">
          <button
            onClick={handleDecrement}
            disabled={isOutOfStock || quantity <= 1}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            aria-label="Diminuer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {isOutOfStock ? 0 : quantity}
          </span>

          <button
            onClick={handleIncrement}
            disabled={isOutOfStock || quantity >= product.stock}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            aria-label="Augmenter"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          size="lg"
          className="flex-1 h-12 gap-2 text-sm sm:text-base font-bold shadow-xl shadow-zinc-900/10 dark:shadow-none active:scale-[0.98]"
        >
          <ShoppingBag className="w-5 h-5 flex-shrink-0" />
          <span>
            {isOutOfStock
              ? (isAr ? "المنتج غير متوفر حالياً" : "Produit épuisé")
              : (isAr ? "أضف إلى السلة" : "Ajouter au panier")}
          </span>
        </Button>
      </div>
    </div>
  );
}
