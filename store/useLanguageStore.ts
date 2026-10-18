import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Language = "fr" | "ar";

interface LanguageStore {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: "fr",
      setLang: (lang) => {
        set({ lang });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
          document.documentElement.setAttribute("lang", lang);
        }
      },
      toggleLang: () => {
        const nextLang = get().lang === "fr" ? "ar" : "fr";
        get().setLang(nextLang);
      },
    }),
    {
      name: "aresstore-language",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
