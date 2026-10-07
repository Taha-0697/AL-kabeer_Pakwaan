'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language, TranslationKey, setLanguage, setDynamicTranslations, t as translateFn } from '@/lib/i18n';
import { themeConfig } from '@/theme.config';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
  isRTL: boolean;
  refreshTranslations: () => Promise<void>;
}

const defaultAppLang = (themeConfig.defaultLanguage as Language) || 'en';

const LanguageContext = createContext<LanguageContextType>({
  lang: defaultAppLang,
  setLang: () => { },
  t: (key) => translateFn(key),
  isRTL: defaultAppLang === 'ur',
  refreshTranslations: async () => { },
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>(defaultAppLang);
  const [, setTick] = useState(0); // For forcing re-render once dynamic translations arrive
  const isRTL = lang === 'ur';

  const applyLang = (newLang: Language) => {
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    if (newLang === 'ur') {
      document.documentElement.style.fontFamily = "'Noto Nastaliq Urdu', 'Noto Sans Arabic', system-ui, sans-serif";
    } else {
      document.documentElement.style.fontFamily = '';
    }
  };

  const fetchDbTranslations = useCallback(async () => {
    try {
      const res = await fetch('/api/localization');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDynamicTranslations(data.data);
        setTick((t) => t + 1);
      }
    } catch {
      // Fallback silently to static in-memory dictionary
    }
  }, []);

  useEffect(() => {
    // Load Google Fonts for Noto Nastaliq Urdu & Noto Sans Arabic
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap';
    document.head.appendChild(link);

    const saved = localStorage.getItem('appLang') as Language;
    const initialLang = (saved === 'ur' || saved === 'en') ? saved : defaultAppLang;
    setLangState(initialLang);
    setLanguage(initialLang);
    applyLang(initialLang);

    fetchDbTranslations();
  }, [fetchDbTranslations]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setLanguage(newLang);
    localStorage.setItem('appLang', newLang);
    applyLang(newLang);
  };

  const t = (key: TranslationKey | string): string => {
    return translateFn(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, refreshTranslations: fetchDbTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
