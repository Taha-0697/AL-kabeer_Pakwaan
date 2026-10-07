import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header />
        <main className="p-6 space-y-6 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
              {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
