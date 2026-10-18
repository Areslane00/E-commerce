"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/store/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";
  const t = translations[mounted ? lang : "fr"];

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {t.cartTitle}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {totalItems} {isAr ? "منتج مختار" : `article${totalItems > 1 ? "s" : ""} sélectionné${totalItems > 1 ? "s" : ""}`}
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
            >
              {isAr ? "تفريغ السلة" : "Vider le panier"}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4 animate-float">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {t.cartEmpty}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
              {t.cartEmptySubtitle}
            </p>
            <Link href="/">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.continueShopping}</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all"
                >
                  <div className="relative w-full sm:w-28 aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 112px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 hover:underline"
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                          title={isAr ? "حذف" : "Supprimer du panier"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-zinc-500 uppercase">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 px-2 py-1">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30"
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30"
                          disabled={quantity >= product.stock}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right rtl:text-left">
                        <span className="block text-xs text-zinc-400">
                          {formatPrice(product.price)} x {quantity}
                        </span>
                        <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                          {formatPrice(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Card */}
            <div className="rounded-3xl p-6 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {isAr ? "ملخص الطلبية" : "Récapitulatif de la commande"}
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t.subtotal}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t.delivery} (58 Wilayas)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {t.free}
                  </span>
                </div>
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t.totalToPay}
                  </span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr
                    ? "الدفع نقداً بالدينار الجزائري مباشرة للموزع عند استلام طردك وفحصه."
                    : "Paiement en espèces lors de la livraison de votre colis partout en Algérie."}
                </p>
              </div>

              <Link href="/checkout" className="block w-full">
                <Button size="lg" className="w-full gap-2 font-bold shadow-lg shadow-zinc-900/10">
                  <span>{t.checkoutButton}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
