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
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
      {/* Guarantees banner in Algeria */}
      <div className="border-b border-zinc-100 dark:border-zinc-850 py-8 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {isAr ? "توصيل 58 ولاية" : "Livraison 58 Wilayas"}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr ? "شحن سريع لكافة ولايات الجزائر" : "Partout en Algérie"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {isAr ? "الدفع عند الاستلام" : "Paiement à la Livraison"}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr ? "ادفع نقداً بالدينار الجزائري" : "En espèces (DZD) à la remise"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {isAr ? "فحص الطرد قبل الدفع" : "Satisfait ou Échangé"}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr ? "حق معاينة المنتج عند وصوله" : "Service après-vente garanti"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 flex-shrink-0">
              <Headphones className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {isAr ? "خدمة زبائن 7/7" : "Support Réactif 7j/7"}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr ? "اتصال ومتابعة في الجزائر" : "Assistance téléphonique dédiée"}
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
          <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            {isAr ? "لوحة التحكم" : "Espace Administrateur"}
          </Link>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            {isAr ? "تسجيل الدخول" : "Connexion"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
