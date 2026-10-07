import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/bookings/status — update booking status or paymentStatus
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, status, paymentStatus } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'bookingId required' }, { status: 400 });
    }

    const VALID_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const VALID_PAY_STATUSES = ['UNPAID', 'PARTIAL_ADVANCE', 'PAID', 'OVERPAID'];

    const updateData: Record<string, string> = {};
    if (status && VALID_STATUSES.includes(status)) updateData.status = status;
    if (paymentStatus && VALID_PAY_STATUSES.includes(paymentStatus)) updateData.paymentStatus = paymentStatus;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid update fields provided' }, { status: 400 });
    }

    const booking = await db.booking.update({
      where: { bookingId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
