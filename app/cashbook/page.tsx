'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';

interface CashTransaction {
  txId: string;
  txType: string;
  amount: number;
  category: string;
  paidToFrom?: string;
  comments?: string;
  receiptNumber?: string;
  txDate: string;
}

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashbook');
      const data = await res.json();
      if (data.success) setTransactions(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
  }, []);

  const totalIn = transactions.filter((t) => t.txType === 'CASH_IN').reduce((a, b) => a + b.amount, 0);
  const totalOut = transactions.filter((t) => t.txType === 'CASH_OUT').reduce((a, b) => a + b.amount, 0);

  return (
    <PageContainer
      title="Financial Cash Book Ledger"
      subtitle="Track Cash In (Bookings/Advances) and Cash Out (Expenses/Purchases) entries"
      action={
        <Button variant="outline" size="sm" onClick={fetchTx} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Refresh Ledger
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-400 font-semibold">Total Cash In</p>
          <p className="text-2xl font-extrabold text-emerald-400">PKR {totalIn.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-400 font-semibold">Total Cash Out</p>
          <p className="text-2xl font-extrabold text-red-400">PKR {totalOut.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-400 font-semibold">Net Register Balance</p>
          <p className="text-2xl font-extrabold text-amber-400">PKR {(totalIn - totalOut).toLocaleString()}</p>
        </Card>
      </div>

      <Card glass className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-4">Receipt # / Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Category</th>
                <th className="p-4">Paid To / From</th>
                <th className="p-4">Comments</th>
                <th className="p-4 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {transactions.map((t) => (
                <tr key={t.txId} className="hover:bg-slate-800/40">
                  <td className="p-4 space-y-0.5">
                    <p className="font-bold text-amber-400">{t.receiptNumber || t.txId.substring(0, 8)}</p>
                    <p className="text-[11px] text-slate-400">{new Date(t.txDate).toLocaleString()}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant={t.txType === 'CASH_IN' ? 'success' : 'danger'} className="gap-1">
                      {t.txType === 'CASH_IN' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      <span>{t.txType}</span>
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-200">{t.category}</td>
                  <td className="p-4 text-slate-300">{t.paidToFrom || '-'}</td>
                  <td className="p-4 text-slate-400">{t.comments || '-'}</td>
                  <td className={`p-4 text-right font-extrabold ${t.txType === 'CASH_IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.txType === 'CASH_IN' ? '+' : '-'} PKR {t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
