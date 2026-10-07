import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const pendingBookings = await db.booking.count({ where: { status: 'PENDING' } });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayBookings = await db.booking.count({
      where: { eventDate: { gte: startOfDay, lte: endOfDay } },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthBookings = await db.booking.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { grandTotal: true, totalPaid: true, balance: true },
    });

    const monthRevenue = monthBookings.reduce((sum, b) => sum + b.totalPaid, 0);

    const allBookings = await db.booking.findMany({
      select: { balance: true },
    });
    const totalReceivables = allBookings.reduce((sum, b) => sum + b.balance, 0);

    const monthCashOut = await db.cashTransaction.aggregate({
      where: { txType: 'CASH_OUT', txDate: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    const monthExpenses = monthCashOut._sum.amount || 0.0;

    const netProfit = monthRevenue - monthExpenses;

    const cashInTotal = await db.cashTransaction.aggregate({
      where: { txType: 'CASH_IN' },
      _sum: { amount: true },
    });
    const cashOutTotal = await db.cashTransaction.aggregate({
      where: { txType: 'CASH_OUT' },
      _sum: { amount: true },
    });
    const cashBalance = (cashInTotal._sum.amount || 0) - (cashOutTotal._sum.amount || 0);

    const lowStockCount = await db.inventoryItem.count({
      where: {
        AND: [
          { minStock: { gt: 0 } },
          { currentStock: { lte: db.inventoryItem.fields.minStock } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        pendingBookings,
        todayBookings,
        monthRevenue,
        totalReceivables,
        monthExpenses,
        netProfit,
        cashBalance,
        lowStockCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
