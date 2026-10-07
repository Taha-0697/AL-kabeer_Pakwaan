import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only Super Admin can approve orders' },
        { status: 403 }
      );
    }

    const booking = await db.booking.findUnique({ where: { bookingId } });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const updated = await db.booking.update({
      where: { bookingId },
      data: {
        status: 'APPROVED',
        approvedBy: payload.userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order approved successfully by Super Admin',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
