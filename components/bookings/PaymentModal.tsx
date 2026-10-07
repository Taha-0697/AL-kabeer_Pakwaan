'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookingDetail } from './BookingListTable';

export const PaymentModal: React.FC<{
  booking: BookingDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ booking, onClose, onSuccess }) => {
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
    <Modal isOpen={!!booking} onClose={onClose} title={`Record Payment - ${booking.bookingNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        <div className="p-3 rounded-xl bg-slate-800 text-xs space-y-1">
          <p className="text-slate-400">Client: <span className="text-slate-100 font-bold">{booking.clientName}</span></p>
          <p className="text-slate-400">Current Balance: <span className="text-red-400 font-bold">PKR {booking.balance.toLocaleString()}</span></p>
        </div>

        <Input
          label="Payment Amount (PKR)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          max={booking.balance}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="Cash">Cash in Hand</option>
            <option value="Bank Transfer">Bank Transfer (Meezan/HBL)</option>
            <option value="Cheque">Cheque</option>
            <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
          </select>
        </div>

        <Input
          label="Notes / Receipt Reference"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Advance payment for Degh catering..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" isLoading={loading}>
            Save Payment & Issue Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
