import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Bookings metrics
    const pendingBookings = await db.booking.count({
      where: { status: { in: ['PENDING', 'PENDING_APPROVAL'] } },
    });

    const todayBookingsList = await db.booking.findMany({
      where: { eventDate: { gte: startOfDay, lte: endOfDay } },
      select: { guestCount: true },
    });
    const todayBookings = todayBookingsList.length;
    const totalGuestsToday = todayBookingsList.reduce((s, b) => s + (b.guestCount || 0), 0);

    const confirmedBookings = await db.booking.count({
      where: { status: { in: ['CONFIRMED', 'APPROVED', 'IN_PROGRESS'] } },
    });

    const activeDealsCount = await db.deal.count({
      where: { isActive: true },
    });

    // Inventory metrics
    const superStoreCount = await db.inventoryItem.count({
      where: { storeType: 'SUPER_STORE' },
    });
    const kitchenStockCount = await db.inventoryItem.count({
      where: { storeType: 'SUB_STORE' },
    });
    const lowStockCount = await db.inventoryItem.count({
      where: {
        AND: [
          { minStock: { gt: 0 } },
          { currentStock: { lte: db.inventoryItem.fields.minStock } },
        ],
      },
    });

    // Staff & Attendance metrics
    const staffOnDutyCount = await db.attendanceRecord.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PRESENT', 'HALF_DAY'] },
      },
    });

    // Financial metrics (for authorized roles)
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

    return NextResponse.json({
      success: true,
      data: {
        // Operations
        pendingBookings,
        todayBookings,
        confirmedBookings,
        totalGuestsToday,
        activeDealsCount,
        superStoreCount,
        kitchenStockCount,
        lowStockCount,
        staffOnDutyCount,
        // Financials (Access Controlled)
        monthRevenue,
        totalReceivables,
        monthExpenses,
        netProfit,
        cashBalance,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
