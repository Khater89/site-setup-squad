import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import ar from "@/i18n/ar";
import en from "@/i18n/en";

type Language = "ar" | "en";
type Dir = "rtl" | "ltr";

interface LanguageContextType {
  lang: Language;
  dir: Dir;
  isRTL: boolean;
  toggleLang: () => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateShort: (dateStr: string) => string;
  formatDateTime: (dateStr: string) => string;
}

const STORAGE_KEY = "mfn_lang";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = { ar, en };

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {}
  return "ar";
}

function applyDocumentAttributes(lang: Language) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLang);

  // Apply document attributes on mount and language change
  useEffect(() => {
    applyDocumentAttributes(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] || key,
    [lang]
  );

  const locale = lang === "ar" ? "ar-JO" : "en-JO";

  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "JOD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [locale]
  );

  const formatDate = useCallback(
    (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(locale, options || {
          year: "numeric", month: "short", day: "numeric",
        }).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

  const formatDateShort = useCallback(
    (dateStr: string) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

  const formatDateTime = useCallback(
    (dateStr: string) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        }).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

  const dir: Dir = lang === "ar" ? "rtl" : "ltr";
  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{
      lang, dir, isRTL, toggleLang, t,
      formatCurrency, formatDate, formatDateShort, formatDateTime,
    }}>
      <div dir={dir} className={lang === "ar" ? "font-arabic" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
