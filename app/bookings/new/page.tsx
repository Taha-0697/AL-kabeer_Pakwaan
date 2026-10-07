import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { NewOrderForm } from '@/components/bookings/NewOrderForm';

export default function NewBookingPage() {
  return (
    <PageContainer
      title="Create New Catering Booking"
      subtitle="Register event order, guest count, menu items, and transport rates"
    >
      <div className="max-w-4xl mx-auto">
        <NewOrderForm />
      </div>
    </PageContainer>
  );
}
