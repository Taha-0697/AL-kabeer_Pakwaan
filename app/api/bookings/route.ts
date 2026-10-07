import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingCreateSchema } from '@/lib/validations/booking';

export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      include: {
        client: true,
        items: true,
        payments: true,
        crockeryItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = bookingCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // ── Auto-create or find client by phone ──────────────────────────────────
    let clientId = data.clientId;
    if (!clientId || clientId === 'new') {
      // Try to find by phone first
      const existing = await db.client.findFirst({ where: { phone: data.clientPhone } });
      if (existing) {
        clientId = existing.clientId;
      } else {
        // Auto-create new client from booking details
        const newClient = await db.client.create({
          data: {
            name: data.clientName,
            phone: data.clientPhone,
            cnic: data.clientCnic,
          },
        });
        clientId = newClient.clientId;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const count = await db.booking.count();
    const bookingNumber = `AKP-${new Date().getFullYear()}-${(count + 1).toLocaleString().padStart(4, '0')
      }`;

    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const taxAmount = (subtotal - data.discountAmount) * (data.taxPercent / 100);
    const grandTotal = subtotal - data.discountAmount + data.transportFee + taxAmount;
    const balance = grandTotal;

    const newBooking = await db.booking.create({
      data: {
        bookingNumber,
        clientId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientCnic: data.clientCnic,
        eventDate: new Date(data.eventDate),
        eventTime: data.eventTime,
        venue: data.venue,
        guestCount: data.guestCount,
        dealId: data.dealId,
        dealName: data.dealName,
        dealDiscount: data.dealDiscount,
        subtotal,
        discountAmount: data.discountAmount,
        transportFee: data.transportFee,
        taxPercent: data.taxPercent,
        taxAmount,
        grandTotal,
        totalPaid: 0,
        balance,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        notes: data.notes,
        isLabourProvided: data.isLabourProvided,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId || null,
            itemName: item.itemName || null,
            category: item.category,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            variantName: item.variantName || null,
            weightKg: item.weightKg || null,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Update client stats
    await db.client.update({
      where: { clientId },
      data: { totalOrders: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

