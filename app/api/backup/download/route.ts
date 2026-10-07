import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth/jwt';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow more time on Vercel for larger backups

export async function GET() {
  try {
    // 1. Verify User (Must be SUPER_ADMIN)
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyJWT(token);
    if (payload?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Only Super Admin can backup data' }, { status: 403 });
    }

    // 2. Extract all data using Prisma
    const [
      users,
      roles,
      permissions,
      clients,
      bookings,
      inventory,
      transactions,
      salaryPayments,
      notices
    ] = await Promise.all([
      db.user.findMany(),
      db.role.findMany({ include: { rolePermissions: true } }),
      db.permission.findMany(),
      db.client.findMany(),
      db.booking.findMany({ include: { items: true, payments: true } }),
      db.inventoryItem.findMany(),
      db.cashTransaction.findMany(),
      db.salaryPayment.findMany(),
      db.salaryNotice.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      system: 'Al-Kabeer Pakwaan',
      data: {
        users,
        roles,
        permissions,
        clients,
        bookings,
        inventory,
        transactions,
        salaryPayments,
        notices
      }
    };

    // 3. Return as a downloadable JSON file
    const jsonString = JSON.stringify(backupData, null, 2);

    const response = new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ success: false, message: 'Backup failed' }, { status: 500 });
  }
}
