'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  UtensilsCrossed,
  Sparkles,
  Boxes,
  CookingPot,
  Receipt,
  UserCheck,
  ShieldCheck,
  Settings,
  LogOut,
  Globe,
  LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/components/LanguageProvider';
import { themeConfig } from '@/theme.config';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarCheck,
  Users,
  UtensilsCrossed,
  Sparkles,
  Boxes,
  CookingPot,
  Receipt,
  UserCheck,
  ShieldCheck,
  Settings,
};

interface NavItem {
  itemId: string;
  name: string;
  href: string;
  icon: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [items, setItems] = useState<NavItem[]>([]);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    fetch('/api/navigation')
      .then((r) => r.json())
      .then((d) => d.success && setItems(d.data))
      .catch((e) => console.error('Failed to load navigation', e));
  }, []);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ur' : 'en');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          {themeConfig.branding.logoUrl ? (
            <img src={themeConfig.branding.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-xl" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-glow">
              {themeConfig.branding.systemName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-bold text-white text-base leading-tight">{themeConfig.branding.systemName}</h1>
            <p className="text-xs text-amber-500 font-semibold tracking-wide">{themeConfig.branding.tagline}</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = iconMap[item.icon] || LayoutDashboard;
            // Map the API name to a translation key if possible, else lowercase it
            const tKey = item.name.toLowerCase() as any;

            return (
              <Link
                key={item.itemId}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                )}
              >
                <Icon className={clsx('h-5 w-5', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{t(tKey) || item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>{lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}</span>
        </button>
        <button
          onClick={() => {
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};
