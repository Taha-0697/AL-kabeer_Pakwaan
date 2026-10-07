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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeVars = {
    '--theme-primary': themeConfig.colors.primary,
    '--theme-secondary': themeConfig.colors.secondary,
    '--theme-bg': themeConfig.colors.background,
    '--theme-text': themeConfig.colors.text,
  } as React.CSSProperties;

  return (
    <html lang={themeConfig.defaultLanguage} className="dark">
      <body className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen" style={themeVars}>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

