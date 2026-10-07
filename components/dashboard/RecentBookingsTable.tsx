'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, User, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export interface BookingSummary {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
}

interface RecentBookingsTableProps {
  bookings: BookingSummary[];
  /** When false, financial columns (amount, payment status) are hidden */
  showFinancials?: boolean;
}

export const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({
  bookings,
  showFinancials = true,
}) => {
  const { t } = useLanguage();

  // Number of columns (for colSpan on empty state row)
  const colCount = showFinancials ? 6 : 4;

  return (
    <Card glass className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('recentBookings')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('latestOrders')}</p>
        </div>
        <Link
          href="/bookings"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
        >
          <span>{t('viewAllBookings')}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3">{t('bookingNumber')}</th>
              <th className="pb-3">{t('client')}</th>
              <th className="pb-3">{t('eventDate')}</th>
              <th className="pb-3">{t('status')}</th>
              {showFinancials && (
                <>
                  <th className="pb-3">{t('grandTotal')} (PKR)</th>
                  <th className="pb-3">{t('paymentStatus')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-6 text-center text-slate-400 dark:text-slate-500">
                  {t('noBookingsFound')}
                </td>
              </tr>
            ) : (
              bookings.slice(0, 5).map((b) => (
                <tr key={b.bookingId} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-bold text-amber-600 dark:text-amber-400">{b.bookingNumber}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-800 dark:text-slate-200">{b.clientName}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{new Date(b.eventDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {t(b.status.toLowerCase()) || b.status}
                    </Badge>
                  </td>
                  {showFinancials && (
                    <>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {b.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <Badge variant={b.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                          {t(b.paymentStatus.toLowerCase()) || b.paymentStatus}
                        </Badge>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
