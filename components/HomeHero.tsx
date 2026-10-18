"use client";

import React, { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import { Truck, ShieldCheck, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

export function HomeHero() {
  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = translations[mounted ? lang : "fr"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-orange-50/30 to-transparent dark:from-emerald-950/20 dark:via-zinc-950 dark:to-transparent py-8 sm:py-16 border-b border-amber-200/40 dark:border-zinc-800/60">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(0,0,0,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Algeria 58 Wilayas delivery pill */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          <span>{t.heroBadge}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-tight sm:leading-[1.18]">
          {t.heroTitle}
        </h1>

        <p className="mt-3 sm:mt-5 text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* 4 Guarantees in Algeria - Clean 2-column grid on mobile, flex row on desktop */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-6 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl bg-white/60 dark:bg-zinc-900/40 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{t.delivery58}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl bg-white/60 dark:bg-zinc-900/40 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{t.guaranteePay}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl bg-white/60 dark:bg-zinc-900/40 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{t.guaranteeQuality}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 sm:p-0 rounded-xl bg-white/60 dark:bg-zinc-900/40 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
            <span className="truncate">{t.guaranteeSupport}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
