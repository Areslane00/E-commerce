"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Zap, Layers, Video as VideoIcon } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useToast } from "@/components/ui/Toast";
import { DirectOrderModal } from "@/components/DirectOrderModal";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [isDirectOrderOpen, setIsDirectOrderOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";
  const { success, error } = useToast();
  const isOutOfStock = product.stock <= 0;

  const hasPromo = Boolean(
    product.original_price && Number(product.original_price) > Number(product.price)
  );
  const discountPercent = hasPromo
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  // Gestion des multiples photos
  const validImages = (product.images && product.images.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : []
  ).filter(Boolean);

  const primaryImage = validImages[0] || product.image_url || null;
  const secondaryImage = validImages.length > 1 ? validImages[1] : null;

  // Clic sur "Ajouter au panier" -> Ajoute l'article ET ouvre immédiatement le panier
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const result = addItem(product, 1);
    if (result.success) {
      success(
        isAr ? `تمت إضافة "${product.name}" إلى السلة` : `"${product.name}" a été ajouté au panier.`,
        isAr ? "أُضيف بنجاح" : "Ajouté !"
      );
      // Ouvrir automatiquement le panneau du panier coulissant
      openCart();
    } else {
      error(result.message, isAr ? "تنبيه" : "Attention");
    }
  };

  // Clic sur "Commander" -> Ouvre le modal de commande directe express sans passer par le panier
  const handleDirectOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    setIsDirectOrderOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          isOutOfStock && "opacity-60 grayscale-[40%] hover:translate-y-0 hover:shadow-none bg-zinc-50 dark:bg-zinc-900/50"
        )}
      >
        {/* Product Image Container */}
        <Link
          href={`/product/${product.id}`}
          className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 block"
        >
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={cn(
                  "object-cover transition-all duration-500",
                  secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                )}
              />
              {/* Deuxième photo affichée au survol pour les articles multi-photos */}
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} vue 2`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
            </div>
          )}

          {/* Badge Multi-Photos & Vidéos */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rtl:right-auto rtl:left-2 rtl:sm:left-3 z-10 flex items-center gap-1.5">
            {product.videos && product.videos.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                <VideoIcon className="w-3 h-3" />
                <span>{product.videos.length > 1 ? `${product.videos.length} vidéos` : "Vidéo"}</span>
              </span>
            )}

            {validImages.length > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-black/60 text-white backdrop-blur-md shadow-sm">
                <Layers className="w-3 h-3" />
                <span>{validImages.length} photos</span>
              </span>
            )}
          </div>

          {/* Stock Status Badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 rtl:left-auto rtl:right-2 rtl:sm:right-3 z-10">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-wide uppercase bg-rose-600 text-white shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {isAr ? "نفذت" : "Terminé"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                {isAr ? "متوفر" : "Disponible"}
              </span>
            )}
          </div>

          {/* Promotion Badge & Low Stock Warning Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 rtl:right-auto rtl:left-2 rtl:sm:left-3 z-10 flex flex-col items-end rtl:items-start gap-1">
            {hasPromo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase bg-rose-600 text-white shadow-md animate-pulse">
                <span>{isAr ? "(تخفيض)" : "(Promo)"}</span>
                {discountPercent > 0 && <span>-{discountPercent}%</span>}
              </span>
            )}
            {!isOutOfStock && product.stock < 5 && (
              <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide uppercase bg-amber-500/90 text-white shadow-sm backdrop-blur-sm">
                {isAr ? `متبقي ${product.stock}` : `Plus que ${product.stock}`}
              </span>
            )}
          </div>

          {/* Category Pill */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 rtl:left-auto rtl:right-2 rtl:sm:right-3 z-10">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
              {product.category}
            </span>
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-4 justify-between">
          <div>
            <Link href={`/product/${product.id}`} className="block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <h3 className="font-semibold text-xs sm:text-base text-zinc-900 dark:text-zinc-50 line-clamp-1 leading-snug">
                {product.name}
              </h3>
            </Link>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {product.description || (isAr ? "منتج ذو جودة عالية متوفر للطلب الآن." : "Aucune description fournie.")}
            </p>
          </div>

          {/* Price Section */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between gap-2">
            {hasPromo ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-500">
                    {isAr ? "السابق:" : "Avant :"}
                  </span>
                  <span className="text-[11px] sm:text-xs line-through text-zinc-400 dark:text-zinc-500 font-semibold">
                    {formatPrice(product.original_price!)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    {isAr ? "الحالي:" : "Actuel :"}
                  </span>
                  <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">
                  {isAr ? "السعر" : "Prix"}
                </span>
                <div>
                  <span className="text-sm sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Deux Boutons : 1. Commander (Achat direct) & 2. Ajouter au panier */}
          <div className="mt-3 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full h-9 flex items-center justify-center rounded-xl text-xs font-semibold bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
              >
                {isAr ? "نفذت الكمية" : "Épuisé"}
              </button>
            ) : (
              <>
                {/* Bouton 1 : Commander (Direct) */}
                <button
                  type="button"
                  onClick={handleDirectOrder}
                  className="flex-1 h-9 sm:h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/15"
                  title={isAr ? "اطلب هذا المنتج مباشرة" : "Commander cet article directement"}
                >
                  <Zap className="w-3.5 h-3.5 fill-current flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {isAr ? "اطلب الآن" : "Commander"}
                  </span>
                </button>

                {/* Bouton 2 : Ajouter au panier (affiche le panier au clic) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-9 sm:h-9 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 active:scale-95 transition-all"
                  title={isAr ? "أضف للسلة واعرضها" : "Ajouter au panier"}
                >
                  <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">
                    {isAr ? "السلة" : "Panier"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de commande directe express */}
      <DirectOrderModal
        product={product}
        isOpen={isDirectOrderOpen}
        onClose={() => setIsDirectOrderOpen(false)}
        initialQuantity={1}
      />
    </>
  );
}
