import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  cnic: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: { bookings: { select: { bookingId: true, grandTotal: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = clientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }
    const client = await db.client.create({ data: result.data });
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
