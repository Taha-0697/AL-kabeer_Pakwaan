'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, User, ArrowUpRight } from 'lucide-react';

export interface BookingSummary {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
}

export const RecentBookingsTable: React.FC<{ bookings: BookingSummary[] }> = ({ bookings }) => {
  return (
    <Card glass className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Recent Event Bookings</h3>
          <p className="text-xs text-slate-400">Latest orders placed by clients</p>
        </div>
        <Link
          href="/bookings"
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          <span>View All Bookings</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3">Booking #</th>
              <th className="pb-3">Client</th>
              <th className="pb-3">Event Date</th>
              <th className="pb-3">Total (PKR)</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No bookings found yet. Create your first booking!
                </td>
              </tr>
            ) : (
              bookings.slice(0, 5).map((b) => (
                <tr key={b.bookingId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-bold text-amber-400">{b.bookingNumber}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-200">{b.clientName}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(b.eventDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-white">
                    {b.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5">
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <Badge variant={b.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                      {b.paymentStatus}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
