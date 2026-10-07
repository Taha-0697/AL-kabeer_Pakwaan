import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const cashTransactionSchema = z.object({
  txType: z.enum(['CASH_IN', 'CASH_OUT']),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  paidToFrom: z.string().optional(),
  comments: z.string().optional(),
  reference: z.string().optional(),
  bookingId: z.string().optional(),
});

export async function GET() {
  try {
    const transactions = await db.cashTransaction.findMany({
      orderBy: { txDate: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = cashTransactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const count = await db.cashTransaction.count();
    const receiptNumber = `CB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const tx = await db.cashTransaction.create({
      data: {
        ...result.data,
        receiptNumber,
      },
    });

    return NextResponse.json({ success: true, data: tx }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
