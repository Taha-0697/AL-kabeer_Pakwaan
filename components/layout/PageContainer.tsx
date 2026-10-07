'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguage } from '@/components/LanguageProvider';
import { clsx } from 'clsx';

export interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  action,
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      <Sidebar />
      <div className={clsx(
        'flex-1 flex flex-col min-w-0 transition-all duration-200',
        isRTL ? 'md:pr-64' : 'md:pl-64'
      )}>
        <Header />
        <main className="p-6 space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
