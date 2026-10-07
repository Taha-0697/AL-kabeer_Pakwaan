'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { BookingListTable, BookingDetail } from '@/components/bookings/BookingListTable';
import { PaymentModal } from '@/components/bookings/PaymentModal';
import { Button } from '@/components/ui/Button';
import { PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useLanguage } from '@/components/LanguageProvider';

export default function BookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch {
      console.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <PageContainer
      title={t('eventBookings')}
      subtitle={t('bookingsSubtitle')}
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
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
      <BookingListTable
        bookings={bookings}
        loading={loading}
        onRecordPayment={(b) => setSelectedBooking(b)}
        onStatusChange={fetchBookings}
      />
      <PaymentModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onSuccess={fetchBookings}
      />
    </PageContainer>
  );
}
