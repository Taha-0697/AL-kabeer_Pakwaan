'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey, setLanguage } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => { },
  t: (key) => translations['en'][key] || key,
  isRTL: false,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en');
  const isRTL = lang === 'ur';

  const applyLang = (newLang: Language) => {
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    // Add/remove a font for Urdu (Noto Nastaliq Urdu)
    if (newLang === 'ur') {
      document.documentElement.style.fontFamily = "'Noto Nastaliq Urdu', serif";
    } else {
      document.documentElement.style.fontFamily = '';
    }
  };

  useEffect(() => {
    // Load Noto Nastaliq Urdu font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
    document.head.appendChild(link);

    const saved = localStorage.getItem('appLang') as Language;
    if (saved === 'ur' || saved === 'en') {
      setLangState(saved);
      setLanguage(saved);
      applyLang(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setLanguage(newLang);
    localStorage.setItem('appLang', newLang);
    applyLang(newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
