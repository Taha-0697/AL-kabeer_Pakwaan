'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, User, Phone, MapPin, DollarSign } from 'lucide-react';

export interface BookingDetail {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  guestCount: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  status: string;
  paymentStatus: string;
}

export const BookingListTable: React.FC<{
  bookings: BookingDetail[];
  onRecordPayment: (booking: BookingDetail) => void;
}> = ({ bookings, onRecordPayment }) => {
  return (
    <Card glass className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">Booking #</th>
              <th className="p-4">Client</th>
              <th className="p-4">Event & Venue</th>
              <th className="p-4">Guests</th>
              <th className="p-4">Total / Balance</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No bookings available. Click &quot;Create New Order&quot; to add one.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.bookingId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-amber-400">{b.bookingNumber}</td>
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <User className="h-3.5 w-3.5 text-brand-400" />
                      <span>{b.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Phone className="h-3 w-3" />
                      <span>{b.clientPhone}</span>
                    </div>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" />
                      <span>{new Date(b.eventDate).toLocaleDateString()} @ {b.eventTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span>{b.venue}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-200">{b.guestCount} Persons</td>
                  <td className="p-4 space-y-0.5">
                    <p className="font-bold text-white">PKR {b.grandTotal.toLocaleString()}</p>
                    <p className="text-[11px] text-red-400">Bal: PKR {b.balance.toLocaleString()}</p>
                  </td>
                  <td className="p-4 space-y-1">
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                    <div>
                      <Badge variant={b.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                        {b.paymentStatus}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {b.balance > 0 && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => onRecordPayment(b)}
                        leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                      >
                        Add Payment
                      </Button>
                    )}
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
