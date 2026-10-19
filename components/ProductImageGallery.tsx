"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Play, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images?: string[];
  videos?: string[];
  productName: string;
  hasPromo?: boolean;
  discountPercent?: number;
}

export function ProductImageGallery({
  images = [],
  videos = [],
  productName,
  hasPromo = false,
  discountPercent = 0,
}: ProductImageGalleryProps) {
  const validImages = images.filter((img) => typeof img === "string" && img.trim().length > 0);
  const validVideos = videos.filter((vid) => typeof vid === "string" && vid.trim().length > 0);

  // Liste unifiée des médias (photos d'abord, puis vidéos)
  const mediaList: { type: "image" | "video"; url: string }[] = [
    ...validImages.map((url) => ({ type: "image" as const, url })),
    ...validVideos.map((url) => ({ type: "video" as const, url })),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const activeMedia = mediaList[currentIndex] || mediaList[0] || null;
  const totalMedia = mediaList.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalMedia - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === totalMedia - 1 ? 0 : prev + 1));
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

        {/* Badge Type de média / Compteur */}
        {totalMedia > 1 && (
          <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-10 flex items-center gap-2">
            {activeMedia?.type === "video" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md">
                <VideoIcon className="w-3.5 h-3.5" />
                <span>Vidéo produit</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-md shadow-md">
                <Eye className="w-3.5 h-3.5" />
                <span>{currentIndex + 1} / {totalMedia}</span>
              </span>
            )}
          </div>
        )}

        {/* Flèches de navigation Suivant / Précédent */}
        {totalMedia > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700 opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
              aria-label="Média précédent"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700 opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all"
              aria-label="Média suivant"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Média affiché (Vidéo HTML5 ou Image) */}
        {activeMedia ? (
          activeMedia.type === "video" ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <video
                key={activeMedia.url}
                src={activeMedia.url}
                controls
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain"
              >
                Votre navigateur ne prend pas en charge la lecture de cette vidéo.
              </video>
            </div>
          ) : (
            <Image
              key={activeMedia.url}
              src={activeMedia.url}
              alt={`${productName} - photo ${currentIndex + 1}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
            <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
            <span className="text-xs">Aucun média disponible</span>
          </div>
        )}
      </div>

      {/* Barre des miniatures si plus d'un média */}
      {totalMedia > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          {mediaList.map((media, idx) => {
            const isSelected = idx === currentIndex;
            const isVideo = media.type === "video";

            return (
              <button
                key={`${media.url}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 transition-all flex-shrink-0 cursor-pointer",
                  isSelected
                    ? "border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/30 scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
                aria-label={isVideo ? `Lire la vidéo ${idx + 1}` : `Afficher la photo ${idx + 1}`}
              >
                {isVideo ? (
                  <div className="relative w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white translate-x-0.5" />
                    </div>
                    <span className="text-[9px] font-bold mt-1 text-zinc-300">Vidéo</span>
                  </div>
                ) : (
                  <Image
                    src={media.url}
                    alt={`${productName} miniature ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
