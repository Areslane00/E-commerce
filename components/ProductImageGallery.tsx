"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images?: string[];
  productName: string;
  hasPromo?: boolean;
  discountPercent?: number;
}

export function ProductImageGallery({
  images = [],
  productName,
  hasPromo = false,
  discountPercent = 0,
}: ProductImageGalleryProps) {
  const validImages = images.filter((img) => typeof img === "string" && img.trim().length > 0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeImage = validImages[currentIndex] || validImages[0] || null;
  const totalImages = validImages.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Grande vue principale */}
      <div className="group relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
        {/* Badge Promotion */}
        {hasPromo && (
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide uppercase bg-rose-600 text-white shadow-xl animate-pulse">
              <span>(Promotion) / (تخفيض)</span>
              {discountPercent > 0 && <span>-{discountPercent}%</span>}
            </span>
          </div>
        )}

        {/* Badge Compteur d'images */}
        {totalImages > 1 && (
          <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-md shadow-md">
              <Eye className="w-3.5 h-3.5" />
              <span>{currentIndex + 1} / {totalImages}</span>
            </span>
          </div>
        )}

        {/* Flèches de navigation Suivant / Précédent */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700 opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700 opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Image affichée */}
        {activeImage ? (
          <Image
            key={activeImage}
            src={activeImage}
            alt={`${productName} - photo ${currentIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
            <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
            <span className="text-xs">Aucune image disponible</span>
          </div>
        )}
      </div>

      {/* Barre des miniatures si plus d'une photo */}
      {totalImages > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          {validImages.map((img, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 transition-all flex-shrink-0 cursor-pointer",
                  isSelected
                    ? "border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/30 scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
                aria-label={`Afficher la photo ${idx + 1}`}
              >
                <Image
                  src={img}
                  alt={`${productName} miniature ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
