'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { KpiGrid, Kpis } from '@/components/dashboard/KpiGrid';
import { RecentBookingsTable, BookingSummary } from '@/components/dashboard/RecentBookingsTable';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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
      const [kpiRes, bookingRes] = await Promise.all([
        fetch('/api/dashboard/kpis'),
        fetch('/api/bookings'),
      ]);
      const kpiData = await kpiRes.json();
      const bookingData = await bookingRes.json();

      if (kpiData.success) setKpis(kpiData.data);
      if (bookingData.success) setBookings(bookingData.data);
    } catch {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageContainer
      title="Dashboard Overview"
      subtitle="Real-time catering business operations, bookings, & revenue monitoring"
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission="action:booking_create">
            <Link href="/bookings/new">
              <Button variant="gold" size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
                Create New Order
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      }
    >
      <KpiGrid kpis={kpis} />
      <RecentBookingsTable bookings={bookings} />
    </PageContainer>
  );
}
