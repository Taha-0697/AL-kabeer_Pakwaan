'use client';

import React from 'react';
import { Bell, Search, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clsx } from 'clsx';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL, lang, setLang } = useLanguage();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className={clsx('absolute top-2.5 h-4 w-4 text-slate-400', isRTL ? 'right-3' : 'left-3')} />
          <input
            type="text"
            placeholder={t('quickSearch')}
            className={clsx(
              'w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-brand-500',
              isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          title={lang === 'en' ? t('switchToUrdu') : t('switchToEnglish')}
        >
          <span className={clsx(lang === 'en' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400')}>EN</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className={clsx(lang === 'ur' ? 'text-brand-600 dark:text-brand-400 font-nastaliq' : 'text-slate-400')}>اردو</span>
        </button>
        <ThemeToggle />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-600/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
            <User className="h-5 w-5" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
              {user?.name || t('superAdmin')}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                {user?.role ? (t(user.role.toLowerCase()) !== user.role.toLowerCase() ? t(user.role.toLowerCase()) : user.role) : 'SUPER_ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
