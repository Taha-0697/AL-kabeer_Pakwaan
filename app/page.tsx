'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { KpiGrid, Kpis } from '@/components/dashboard/KpiGrid';
import { RecentBookingsTable, BookingSummary } from '@/components/dashboard/RecentBookingsTable';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/lib/auth/useAuth';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, hasPermission } = useAuth();

  // Determine if the current user may see financial data
  const role = user?.role?.toUpperCase() || 'VIEWER';
  const canViewFinance =
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'ACCOUNTS_STAFF' ||
    hasPermission('screen:cashbook') ||
    hasPermission('screen:finance');

  // All roles that can see the bookings screen get the recent bookings table
  const canViewBookings = hasPermission('screen:bookings') || canViewFinance;

  const [kpis, setKpis] = useState<Kpis>({
    pendingBookings: 0,
    todayBookings: 0,
    monthRevenue: 0,
    totalReceivables: 0,
    monthExpenses: 0,
    netProfit: 0,
    cashBalance: 0,
    lowStockCount: 0,
  });
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [fetch('/api/dashboard/kpis')];
      if (canViewBookings) requests.push(fetch('/api/bookings'));

      const [kpiRes, bookingRes] = await Promise.all(requests);
      const kpiData = await kpiRes.json();
      if (kpiData.success) setKpis(kpiData.data);

      if (bookingRes) {
        const bookingData = await bookingRes.json();
        if (bookingData.success) setBookings(bookingData.data);
      }
    } catch {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title={t('dashboardOverview')}
      subtitle={t('dashboardSubtitle')}
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {t('refresh')}
          </Button>
          <PermissionGuard permission="action:booking_create">
            <Link href="/bookings/new">
              <Button variant="gold" size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
                {t('createNewOrder')}
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      }
    >
      <KpiGrid kpis={kpis} />
      {canViewBookings && (
        <RecentBookingsTable bookings={bookings} showFinancials={canViewFinance} />
      )}
    </PageContainer>
  );
}
