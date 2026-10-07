'use client';

import React from 'react';
import {
  CalendarCheck, DollarSign, Wallet, ArrowDownRight, PackageCheck,
  AlertTriangle, Users, Sparkles, Boxes, CookingPot, Clock, ShieldCheck,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/lib/auth/useAuth';

export interface Kpis {
  pendingBookings: number;
  todayBookings: number;
  confirmedBookings?: number;
  totalGuestsToday?: number;
  activeDealsCount?: number;
  superStoreCount?: number;
  kitchenStockCount?: number;
  lowStockCount: number;
  staffOnDutyCount?: number;
  // Financial metrics (restricted)
  monthRevenue?: number;
  totalReceivables?: number;
  monthExpenses?: number;
  netProfit?: number;
  cashBalance?: number;
}

export const KpiGrid: React.FC<{ kpis: Kpis }> = ({ kpis }) => {
  const { t } = useLanguage();
  const { user, hasPermission } = useAuth();

  const role = user?.role?.toUpperCase() || 'VIEWER';
  const canViewFinance =
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'ACCOUNTS_STAFF' ||
    hasPermission('screen:cashbook') ||
    hasPermission('screen:finance');

  // 1. BOOKING_STAFF Dashboard
  if (role === 'BOOKING_STAFF') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('pendingBookings')}
          value={kpis.pendingBookings}
          subtitle="Orders awaiting review"
          icon={<CalendarCheck className="h-6 w-6" />}
          color="brand"
        />
        <StatCard
          title="Today's Events"
          value={kpis.todayBookings}
          subtitle="Scheduled for today"
          icon={<CalendarCheck className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Expected Guests Today"
          value={(kpis.totalGuestsToday || 0).toLocaleString()}
          subtitle="Pax across all venues"
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Active Deals & Packages"
          value={kpis.activeDealsCount || 0}
          subtitle="Live catering promotions"
          icon={<Sparkles className="h-6 w-6" />}
          color="blue"
        />
      </div>
    );
  }

  // 2. INVENTORY_STAFF Dashboard
  if (role === 'INVENTORY_STAFF') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('lowStockAlerts')}
          value={kpis.lowStockCount}
          subtitle={kpis.lowStockCount > 0 ? 'Restock required' : 'All items optimal'}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={kpis.lowStockCount > 0 ? 'red' : 'brand'}
        />
        <StatCard
          title="Super Store (Warehouse)"
          value={kpis.superStoreCount || 0}
          subtitle="Raw material SKU items"
          icon={<Boxes className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Sub Store (Kitchen Stock)"
          value={kpis.kitchenStockCount || 0}
          subtitle="Active kitchen inventory items"
          icon={<CookingPot className="h-6 w-6" />}
          color="brand"
        />
        <StatCard
          title="Kitchen Operations"
          value={kpis.todayBookings}
          subtitle="Events being prepared today"
          icon={<PackageCheck className="h-6 w-6" />}
          color="blue"
        />
      </div>
    );
  }

  // 3. EMPLOYEE Dashboard
  if (role === 'EMPLOYEE') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Staff Duty Status"
          value="ON DUTY"
          subtitle="Active shift logged"
          icon={<ShieldCheck className="h-6 w-6" />}
          color="brand"
        />
        <StatCard
          title="Today's Catered Events"
          value={kpis.todayBookings}
          subtitle="Orders requiring prep"
          icon={<CookingPot className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Kitchen Tasks"
          value={kpis.kitchenStockCount || 0}
          subtitle="Active ingredients available"
          icon={<PackageCheck className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Staff on Duty Today"
          value={kpis.staffOnDutyCount || 0}
          subtitle="Team members present"
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
      </div>
    );
  }

  // 4. MANAGER Dashboard (Operations & Kitchen Focus)
  if (role === 'MANAGER') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('pendingBookings')}
          value={kpis.pendingBookings}
          subtitle={`${kpis.todayBookings} events today`}
          icon={<CalendarCheck className="h-6 w-6" />}
          color="brand"
        />
        <StatCard
          title="Total Guests Expected"
          value={(kpis.totalGuestsToday || 0).toLocaleString()}
          subtitle="Pax for today's orders"
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Staff on Duty"
          value={kpis.staffOnDutyCount || 0}
          subtitle="Active attendance logged"
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t('lowStockAlerts')}
          value={kpis.lowStockCount}
          subtitle={kpis.lowStockCount > 0 ? t('lowStock') : t('inStock')}
          icon={<AlertTriangle className="h-6 w-6" />}
          color={kpis.lowStockCount > 0 ? 'red' : 'brand'}
        />
      </div>
    );
  }

  // 5. SUPER_ADMIN / ADMIN / ACCOUNTS_STAFF Dashboard (Full Financial & Executive Overview)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title={t('pendingBookings')}
        value={kpis.pendingBookings}
        subtitle={`${kpis.todayBookings} ${t('today')}`}
        icon={<CalendarCheck className="h-6 w-6" />}
        color="brand"
      />
      {canViewFinance && (
        <>
          <StatCard
            title={t('monthlyRevenue')}
            value={`PKR ${(kpis.monthRevenue || 0).toLocaleString()}`}
            subtitle={t('thisMonth')}
            icon={<DollarSign className="h-6 w-6" />}
            color="amber"
          />
          <StatCard
            title={t('totalReceivables')}
            value={`PKR ${(kpis.totalReceivables || 0).toLocaleString()}`}
            subtitle={t('balanceDue')}
            icon={<Wallet className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title={t('netProfit')}
            value={`PKR ${(kpis.netProfit || 0).toLocaleString()}`}
            subtitle={`Expenses: PKR ${(kpis.monthExpenses || 0).toLocaleString()}`}
            icon={<ArrowDownRight className="h-6 w-6" />}
            color={(kpis.netProfit || 0) >= 0 ? 'blue' : 'red'}
          />
          <StatCard
            title={t('cashBalance')}
            value={`PKR ${(kpis.cashBalance || 0).toLocaleString()}`}
            subtitle={t('netRegisterBalance')}
            icon={<PackageCheck className="h-6 w-6" />}
            color="brand"
          />
        </>
      )}
      <StatCard
        title={t('lowStockAlerts')}
        value={kpis.lowStockCount}
        subtitle={kpis.lowStockCount > 0 ? t('lowStock') : t('inStock')}
        icon={<AlertTriangle className="h-6 w-6" />}
        color={kpis.lowStockCount > 0 ? 'red' : 'brand'}
      />
    </div>
  );
};
