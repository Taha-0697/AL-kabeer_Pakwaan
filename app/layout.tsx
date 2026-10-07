import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { themeConfig } from '../theme.config';

export const metadata: Metadata = {
  title: `${themeConfig.branding.systemName} | Web Portal`,
  description: themeConfig.branding.tagline,
};

import { LanguageProvider } from '@/components/LanguageProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeVars = {
    '--theme-primary': themeConfig.colors.primary,
    '--theme-secondary': themeConfig.colors.secondary,
    '--theme-text': themeConfig.colors.text,
  } as React.CSSProperties;

  return (
    <html lang={themeConfig.defaultLanguage} suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300 text-slate-800 bg-slate-50 dark:bg-[#020617] dark:text-[#f8fafc]" style={themeVars}>
        <ThemeProvider attribute="class" defaultTheme={themeConfig.defaultTheme || 'dark'} enableSystem>
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
