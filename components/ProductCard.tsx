"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, Check } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/components/ui/Toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { success, error } = useToast();
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const result = addItem(product, 1);
    if (result.success) {
      success(`"${product.name}" a été ajouté au panier.`, "Ajouté !");
    } else {
      error(result.message, "Attention");
    }
  };

  return (
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
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-600 text-white shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Terminé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
              Disponible
            </span>
          )}
        </div>

        {/* Low Stock Warning Badge (if stock > 0 and stock < 5) */}
        {!isOutOfStock && product.stock < 5 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/90 text-white shadow-sm backdrop-blur-sm">
              Plus que {product.stock}
            </span>
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <Link href={`/product/${product.id}`} className="block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description || "Aucune description fournie."}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">
              Prix
            </span>
            <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm",
              isOutOfStock
                ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            )}
            title={isOutOfStock ? "Ce produit est épuisé" : "Ajouter au panier"}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? "Épuisé" : "Ajouter"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
