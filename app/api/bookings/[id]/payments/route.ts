import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingPaymentSchema } from '@/lib/validations/booking';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const result = bookingPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const booking = await db.booking.findUnique({ where: { bookingId } });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const { amount, paymentMethod, notes } = result.data;
    const balanceBefore = booking.balance;
    const balanceAfter = Math.max(0, balanceBefore - amount);
    const newTotalPaid = booking.totalPaid + amount;

    let paymentStatus = 'PARTIAL';
    if (newTotalPaid >= booking.grandTotal) {
      paymentStatus = newTotalPaid > booking.grandTotal ? 'OVERPAID' : 'PAID';
    }

    const count = await db.bookingPayment.count();
    const receiptNumber = `RCP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const payment = await db.bookingPayment.create({
      data: {
        bookingId,
        receiptNumber,
        amount,
        paymentMethod,
        balanceBefore,
        balanceAfter,
        notes,
      },
    });

    await db.booking.update({
      where: { bookingId },
      data: {
        totalPaid: newTotalPaid,
        balance: balanceAfter,
        paymentStatus,
      },
    });

    await db.cashTransaction.create({
      data: {
        txType: 'CASH_IN',
        amount,
        category: 'Booking Payment',
        paidToFrom: booking.clientName,
        comments: notes || `Payment for booking ${booking.bookingNumber}`,
        reference: payment.paymentId,
        bookingId,
        receiptNumber,
      },
    });

    await db.client.update({
      where: { clientId: booking.clientId },
      data: { totalSpent: { increment: amount } },
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
