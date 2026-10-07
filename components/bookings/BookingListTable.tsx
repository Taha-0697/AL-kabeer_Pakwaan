'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Calendar, User, Phone, MapPin, DollarSign,
  CheckCircle, PlayCircle, ThumbsUp, Banknote, XCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/lib/auth/useAuth';

export interface BookingDetail {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  guestCount: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  status: string;
  paymentStatus: string;
}

// Status transitions after APPROVED — via generic /status PATCH
const STATUS_NEXT: Record<string, { label: string; next: string; icon: React.ReactNode; color: string }> = {
  APPROVED: {
    label: 'Start Prep',
    next: 'IN_PROGRESS',
    icon: <PlayCircle className="h-3.5 w-3.5" />,
    color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30',
  },
  IN_PROGRESS: {
    label: 'Mark Complete',
    next: 'COMPLETED',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30',
  },
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'gold'> = {
  PENDING_APPROVAL: 'warning',
  APPROVED: 'gold',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const BookingListTable: React.FC<{
  bookings: BookingDetail[];
  loading?: boolean;
  onRecordPayment: (booking: BookingDetail) => void;
  onStatusChange?: () => void;
}> = ({ bookings, loading, onRecordPayment, onStatusChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>('');

  const role = user?.role?.toUpperCase() || '';
  const canApprove = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER';

  // ① Approve — uses dedicated endpoint (stamps approvedBy + approvedAt)
  const approveOrder = async (bookingId: string) => {
    setUpdatingId(bookingId + '_approve');
    setActionError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) setActionError(data.message || 'Approval failed');
      else onStatusChange?.();
    } catch {
      setActionError('Connection error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ② Generic status change (Start Prep / Mark Complete / Cancel)
  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    setActionError('');
    try {
      await fetch('/api/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      onStatusChange?.();
    } finally {
      setUpdatingId(null);
    }
  };

  // ③ Mark payment status as PAID
  const markPaid = async (bookingId: string) => {
    setUpdatingId(bookingId + '_pay');
    setActionError('');
    try {
      await fetch('/api/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, paymentStatus: 'PAID' }),
      });
      onStatusChange?.();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card glass className="overflow-hidden p-0">
      {actionError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-semibold">
          ⚠ {actionError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">{t('bookingNumber')}</th>
              <th className="p-4">{t('client')}</th>
              <th className="p-4">{t('eventAndVenue')}</th>
              <th className="p-4">{t('guests')}</th>
              <th className="p-4">{t('totalAndBalance')}</th>
              <th className="p-4">{t('status')}</th>
              <th className="p-4 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4 space-y-1"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4 space-y-1"><div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4 space-y-1"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4 space-y-1"><div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 ml-auto" /></td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  {t('noBookingsFound')}
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const nextAction = STATUS_NEXT[b.status];
                const isUpdating =
                  updatingId === b.bookingId ||
                  updatingId === b.bookingId + '_pay' ||
                  updatingId === b.bookingId + '_approve';

                return (
                  <tr key={b.bookingId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">

                    <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{b.bookingNumber}</td>

                    <td className="p-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <User className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                        <span>{b.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Phone className="h-3 w-3" />
                        <span>{b.clientPhone}</span>
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        <span>{new Date(b.eventDate).toLocaleDateString()} @ {b.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span>{b.venue}</span>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                      {b.guestCount} {t('guests')}
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white">PKR {b.grandTotal.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Paid: PKR {b.totalPaid.toLocaleString()}</p>
                      {b.balance > 0 && (
                        <p className="text-[11px] text-red-500 dark:text-red-400">{t('balance')}: PKR {b.balance.toLocaleString()}</p>
                      )}
                    </td>

                    <td className="p-4 space-y-1">
                      <Badge variant={STATUS_BADGE[b.status] ?? 'neutral'}>
                        {b.status.replace(/_/g, ' ')}
                      </Badge>
                      <div>
                        <Badge variant={
                          b.paymentStatus === 'PAID' ? 'success' :
                          b.paymentStatus === 'PARTIAL_ADVANCE' ? 'warning' : 'danger'
                        }>
                          {b.paymentStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">

                        {/* ① APPROVE (Admin/Manager only) */}
                        {b.status === 'PENDING_APPROVAL' && canApprove && (
                          <button
                            disabled={isUpdating}
                            onClick={() => approveOrder(b.bookingId)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 bg-brand-600/20 text-brand-600 dark:text-brand-400 hover:bg-brand-600/30"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Accept Order
                          </button>
                        )}

                        {b.status === 'PENDING_APPROVAL' && !canApprove && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Awaiting approval</span>
                        )}

                        {/* ② CANCEL (Admin/Manager, Pending or Approved only) */}
                        {(b.status === 'PENDING_APPROVAL' || b.status === 'APPROVED') && canApprove && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(b.bookingId, 'CANCELLED')}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}

                        {/* ③ Start Prep / Mark Complete */}
                        {nextAction && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(b.bookingId, nextAction.next)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50 ${nextAction.color}`}
                          >
                            {nextAction.icon}
                            {nextAction.label}
                          </button>
                        )}

                        {/* ④ Add Payment — only after APPROVED */}
                        {b.balance > 0 &&
                          b.status !== 'CANCELLED' &&
                          b.status !== 'PENDING_APPROVAL' && (
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => onRecordPayment(b)}
                              leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                            >
                              {t('addPayment')}
                            </Button>
                          )}

                        {/* ⑤ Mark Paid & Done */}
                        {b.status === 'COMPLETED' && b.paymentStatus !== 'PAID' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => markPaid(b.bookingId)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          >
                            <Banknote className="h-3.5 w-3.5" />
                            Mark Paid &amp; Done
                          </button>
                        )}

                        {/* ⑥ Closed indicator */}
                        {b.paymentStatus === 'PAID' && b.status === 'COMPLETED' && (
                          <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Paid &amp; Closed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
