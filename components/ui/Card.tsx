import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-5 transition-all duration-200',
        glass
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 shadow-glass'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
