'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  ChevronDown, ChevronUp, Receipt, Package,
} from 'lucide-react';

interface BookingItem {
  id: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variantName?: string;
}

interface BookingDetail {
  bookingId: string;
  bookingNumber: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  items: BookingItem[];
}

interface CashTransaction {
  txId: string;
  receiptNumber?: string;
  txDate: string;
  txType: 'CASH_IN' | 'CASH_OUT';
  category: string;
  amount: number;
  paidToFrom?: string;
  comments?: string;
  bookingId?: string;
  booking?: BookingDetail | null;
}

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchTx = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashbook');
      const data = await res.json();
      if (data.success) setTransactions(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const totalIn = transactions.filter((t) => t.txType === 'CASH_IN').reduce((a, b) => a + b.amount, 0);
  const totalOut = transactions.filter((t) => t.txType === 'CASH_OUT').reduce((a, b) => a + b.amount, 0);

  const toggleExpand = (txId: string) => {
    setExpanded(prev => prev === txId ? null : txId);
  };

  return (
    <PageContainer
      title="Financial Cash Book Ledger"
      subtitle="Track Cash In (Bookings/Advances) and Cash Out (Expenses/Purchases) — click a row to see order details"
      action={
        <Button variant="outline" size="sm" onClick={fetchTx} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh Ledger
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Total Cash In</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">PKR {totalIn.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Total Cash Out</p>
          <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">PKR {totalOut.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Net Register Balance</p>
          <p className={`text-2xl font-extrabold ${(totalIn - totalOut) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            PKR {(totalIn - totalOut).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card glass className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-4">Receipt # / Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Category</th>
                <th className="p-4">Paid To / From</th>
                <th className="p-4">Comments</th>
                <th className="p-4 text-right">Amount (PKR)</th>
                <th className="p-4 text-center">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                    <td className="p-4"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                    <td className="p-4"><div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                    <td className="p-4"><div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" /></td>
                    <td className="p-4"><div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                    <td className="p-4"><div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 ml-auto" /></td>
                    <td className="p-4"><div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 mx-auto" /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No cash transactions recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <React.Fragment key={t.txId}>
                    <tr
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${t.bookingId ? 'cursor-pointer' : ''}`}
                      onClick={() => t.bookingId && toggleExpand(t.txId)}
                    >
                      <td className="p-4 space-y-0.5">
                        <p className="font-bold text-amber-600 dark:text-amber-400">{t.receiptNumber || t.txId.substring(0, 8)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(t.txDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge variant={t.txType === 'CASH_IN' ? 'success' : 'danger'} className="gap-1">
                          {t.txType === 'CASH_IN' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          <span>{t.txType === 'CASH_IN' ? 'Cash In' : 'Cash Out'}</span>
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-800 dark:text-slate-200">{t.category}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{t.paidToFrom || '—'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">{t.comments || '—'}</td>
                      <td className={`p-4 text-right font-extrabold ${t.txType === 'CASH_IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.txType === 'CASH_IN' ? '+' : '-'} {t.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {t.bookingId ? (
                          expanded === t.txId
                            ? <ChevronUp className="h-4 w-4 text-slate-400 mx-auto" />
                            : <ChevronDown className="h-4 w-4 text-amber-500 mx-auto" />
                        ) : '—'}
                      </td>
                    </tr>

                    {/* Expanded booking order detail */}
                    {expanded === t.txId && t.bookingId && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 px-6 py-4 space-y-3">
                            {t.booking ? (
                              <>
                                <div className="flex items-center gap-3">
                                  <Receipt className="h-4 w-4 text-amber-500" />
                                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    Booking #{t.booking.bookingNumber}
                                  </span>
                                  <Badge variant="gold" className="text-[10px]">{t.booking.status}</Badge>
                                  <Badge variant={t.booking.paymentStatus === 'PAID' ? 'success' : 'warning'} className="text-[10px]">{t.booking.paymentStatus}</Badge>
                                  <span className="ml-auto text-sm font-bold text-amber-600 dark:text-amber-400">
                                    Grand Total: PKR {t.booking.grandTotal.toLocaleString()}
                                  </span>
                                </div>
                                {t.booking.items && t.booking.items.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                      <Package className="h-3 w-3" /> Order Items
                                    </p>
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-slate-400 dark:text-slate-500">
                                          <th className="text-left py-1 font-semibold">Item</th>
                                          <th className="text-center py-1 font-semibold">Qty</th>
                                          <th className="text-right py-1 font-semibold">Unit Price</th>
                                          <th className="text-right py-1 font-semibold">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {t.booking.items.map((item) => (
                                          <tr key={item.id}>
                                            <td className="py-1 text-slate-700 dark:text-slate-300">
                                              {item.itemName ?? 'Custom Item'}
                                              {item.variantName && <span className="text-slate-400 ml-1">({item.variantName})</span>}
                                            </td>
                                            <td className="py-1 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                            <td className="py-1 text-right text-slate-600 dark:text-slate-400">PKR {item.unitPrice.toLocaleString()}</td>
                                            <td className="py-1 text-right font-bold text-slate-800 dark:text-slate-200">PKR {item.subtotal.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-slate-400">Booking details not loaded.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
