'use client';

import React from 'react';
import { CalendarCheck, DollarSign, Wallet, ArrowDownRight, PackageCheck, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export interface Kpis {
  pendingBookings: number;
  todayBookings: number;
  monthRevenue: number;
  totalReceivables: number;
  monthExpenses: number;
  netProfit: number;
  cashBalance: number;
  lowStockCount: number;
}

export const KpiGrid: React.FC<{ kpis: Kpis }> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Pending Bookings"
        value={kpis.pendingBookings}
        subtitle={`${kpis.todayBookings} scheduled for today`}
        icon={<CalendarCheck className="h-6 w-6" />}
        color="brand"
      />
      <StatCard
        title="Monthly Revenue"
        value={`PKR ${kpis.monthRevenue.toLocaleString()}`}
        subtitle="Current month collection"
        icon={<DollarSign className="h-6 w-6" />}
        color="amber"
      />
      <StatCard
        title="Total Receivables"
        value={`PKR ${kpis.totalReceivables.toLocaleString()}`}
        subtitle="Uncollected client balances"
        icon={<Wallet className="h-6 w-6" />}
        color="purple"
      />
      <StatCard
        title="Net Profit (Month)"
        value={`PKR ${kpis.netProfit.toLocaleString()}`}
        subtitle={`Expenses: PKR ${kpis.monthExpenses.toLocaleString()}`}
        icon={<ArrowDownRight className="h-6 w-6" />}
        color={kpis.netProfit >= 0 ? 'blue' : 'red'}
      />
      <StatCard
        title="Cash Book Balance"
        value={`PKR ${kpis.cashBalance.toLocaleString()}`}
        subtitle="Net cash in register"
        icon={<PackageCheck className="h-6 w-6" />}
        color="brand"
      />
      <StatCard
        title="Low Stock Alerts"
        value={kpis.lowStockCount}
        subtitle="Items below min threshold"
        icon={<AlertTriangle className="h-6 w-6" />}
        color={kpis.lowStockCount > 0 ? 'red' : 'brand'}
      />
    </div>
  );
};
