"use client";

import React, { useEffect, useState } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { lang, toggleLang, setLang } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply initial direction
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", lang);
    }
  }, [lang]);

  if (!mounted) {
    return (
      <button
        aria-label="Changer la langue"
        className="h-10 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
      >
        <Globe className="w-4 h-4 text-emerald-500" />
        <span>FR / AR</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLang}
      aria-label="Changer la langue"
      className="h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200/80 dark:border-zinc-700/80 active:scale-95 shadow-sm"
      title={lang === "fr" ? "Passer en Arabe (العربية)" : "Passer en Français"}
    >
      <Globe className="w-3.5 h-3.5 text-emerald-500" />
      <span>{lang === "fr" ? "العربية" : "Français"}</span>
    </button>
  );
}
