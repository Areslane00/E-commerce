"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Truck, ShieldCheck, Clock, Headphones } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";

export function Footer() {
  const { lang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted && lang === "ar";

  return (
    <footer className="border-t border-amber-200/50 dark:border-zinc-800 bg-amber-50/40 dark:bg-zinc-950 transition-colors">
      {/* Guarantees banner in Algeria */}
      <div className="border-b border-amber-100/60 dark:border-zinc-850 py-6 sm:py-8 bg-amber-50/50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-white/40 dark:bg-zinc-900/30 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {isAr ? "توصيل 58 ولاية" : "Livraison 58 Wilayas"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {isAr ? "كافة ولايات الجزائر" : "Partout en Algérie"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-white/40 dark:bg-zinc-900/30 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {isAr ? "الدفع عند الاستلام" : "Paiement à la Livraison"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {isAr ? "ادفع نقداً بالدينار" : "En espèces (DZD)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-white/40 dark:bg-zinc-900/30 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {isAr ? "فحص الطرد" : "Satisfait ou Échangé"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {isAr ? "معاينة المنتج عند وصوله" : "Garantie sérénité"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-white/40 dark:bg-zinc-900/30 sm:bg-transparent border sm:border-0 border-amber-200/40 dark:border-zinc-800/40">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {isAr ? "خدمة زبائن 7/7" : "Support Réactif 7j/7"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {isAr ? "متابعة مستمرة في الجزائر" : "Assistance téléphonique"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>© {new Date().getFullYear()} AresStore (Algérie). Tous droits réservés.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            {isAr ? "الرئيسية" : "Catalogue"}
          </Link>
          <Link href="/cart" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            {isAr ? "سلة المشتريات" : "Mon Panier"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
