import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/payroll/pay - record a salary payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, month, amount, notes, isPaid } = body;

    if (!employeeId || !month || !amount) {
      return NextResponse.json({ success: false, message: 'employeeId, month, amount required' }, { status: 400 });
    }

    const payment = await db.salaryPayment.create({
      data: { employeeId, month, amount, isPaid: isPaid ?? true, notes },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
