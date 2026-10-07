'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookingDetail } from './BookingListTable';
import { useLanguage } from '@/components/LanguageProvider';

export const PaymentModal: React.FC<{
  booking: BookingDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ booking, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState<number>(booking?.balance || 0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/bookings/${booking.bookingId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod, notes }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to record payment');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!booking} onClose={onClose} title={`${t('recordPayment')} - ${booking.bookingNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2 rounded-lg">{error}</p>}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
          <p className="text-slate-600 dark:text-slate-400">{t('client')}: <span className="text-slate-900 dark:text-slate-100 font-bold">{booking.clientName}</span></p>
          <p className="text-slate-600 dark:text-slate-400">{t('balance')}: <span className="text-red-500 dark:text-red-400 font-bold">PKR {booking.balance.toLocaleString()}</span></p>
        </div>

        <Input
          label={`${t('amount')} (PKR)`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          max={booking.balance}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t('paymentMethod')}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="Cash">{t('cashInHand')}</option>
            <option value="Bank Transfer">{t('bankTransfer')}</option>
            <option value="Cheque">{t('cheque')}</option>
            <option value="JazzCash / EasyPaisa">{t('jazzCashEasyPaisa')}</option>
          </select>
        </div>

        <Input
          label={t('notesOrReceipt')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Advance payment for Degh catering..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="gold" isLoading={loading}>
            {t('savePaymentAndIssueReceipt')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
