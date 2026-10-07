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

    const payment = await db.$transaction(async (tx) => {
      const p = await tx.salaryPayment.create({
        data: { employeeId, month, amount, isPaid: isPaid ?? true, notes },
      });

      if (p.isPaid) {
        const emp = await tx.employee.findUnique({ where: { employeeId } });
        await tx.cashTransaction.create({
          data: {
            txType: 'CASH_OUT',
            category: 'SALARY',
            amount: amount,
            paidToFrom: emp?.name || 'Employee',
            comments: `Salary for ${month} - ${notes || ''}`,
          },
        });
      }

      return p;
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/payroll/pay - update payment status (e.g. mark Paid)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, isPaid, notes, amount } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, message: 'paymentId required' }, { status: 400 });
    }

    const existing = await db.salaryPayment.findUnique({
      where: { paymentId },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Payment record not found' }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      const p = await tx.salaryPayment.update({
        where: { paymentId },
        data: {
          ...(isPaid !== undefined && { isPaid }),
          ...(notes !== undefined && { notes }),
          ...(amount !== undefined && { amount: Number(amount) }),
        },
      });

      // If transition from unpaid to paid, create CashTransaction
      if (!existing.isPaid && isPaid === true) {
        await tx.cashTransaction.create({
          data: {
            txType: 'CASH_OUT',
            category: 'SALARY',
            amount: p.amount,
            paidToFrom: existing.employee.name,
            comments: `Salary for ${p.month} marked as Paid - ${p.notes || ''}`,
          },
        });
      }

      return p;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

