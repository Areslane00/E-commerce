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
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-100/90 via-white to-transparent dark:from-zinc-900/40 dark:via-zinc-950 dark:to-transparent py-14 sm:py-20 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),rgba(0,0,0,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Algeria 58 Wilayas delivery pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>{t.heroBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-[1.18]">
          {t.heroTitle}
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* 4 Guarantees in Algeria */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>{t.delivery58}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t.guaranteePay}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t.guaranteeQuality}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.guaranteeSupport}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
