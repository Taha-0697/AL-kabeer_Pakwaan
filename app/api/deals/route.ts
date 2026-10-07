import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const deals = await db.deal.findMany({
      include: {
        items: true,
      },
      orderBy: { title: 'asc' },
    });
    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, timeSlot, minPersons, maxPersons, pricePerPerson, discountPercent } = body;

    if (!title || !minPersons || !maxPersons || !pricePerPerson) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const deal = await db.deal.create({
      data: {
        title,
        description,
        timeSlot: timeSlot || 'ANY',
        minPersons: Number(minPersons),
        maxPersons: Number(maxPersons),
        pricePerPerson: Number(pricePerPerson),
        discountPercent: Number(discountPercent) || 0,
      }
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { dealId, items, ...data } = body;
    if (!dealId) return NextResponse.json({ success: false, message: 'dealId required' }, { status: 400 });

    // If items array provided, replace deal items
    if (items !== undefined) {
      await db.dealItem.deleteMany({ where: { dealId } });
    }

    const deal = await db.deal.update({
      where: { dealId },
      data: {
        ...data,
        items: items ? {
          create: items.map((i: any) => ({
            menuItemId: i.menuItemId,
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unitPrice) || 0,
          }))
        } : undefined,
      },
      include: { items: { include: { menuItem: true } } },
    });
    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    if (!dealId) return NextResponse.json({ success: false, message: 'dealId required' }, { status: 400 });
    await db.deal.delete({ where: { dealId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
