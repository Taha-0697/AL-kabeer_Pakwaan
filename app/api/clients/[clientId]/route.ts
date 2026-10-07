import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { clientId: string } }) {
  try {
    const client = await db.client.findUnique({
      where: { clientId: params.clientId },
      include: {
        bookings: {
          orderBy: { eventDate: 'desc' },
          include: {
            items: { include: { menuItem: true } },
            payments: true,
          },
        },
      },
    });
    if (!client) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}