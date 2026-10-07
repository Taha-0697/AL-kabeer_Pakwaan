import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const deals = await db.deal.findMany({
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                variants: true,
              },
            },
          },
        },
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
    const { title, description, timeSlot, validDays, minPersons, maxPersons, pricePerPerson, discountPercent } = body;

    if (!title || !minPersons || !maxPersons || !pricePerPerson) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const durationDays = Number(validDays) || 5;

    const deal = await db.deal.create({
      data: {
        title,
        description,
        validDays: durationDays,
        timeSlot: timeSlot || `${durationDays} Days`,
        startDate: new Date(),
        minPersons: Number(minPersons),
        maxPersons: Number(maxPersons),
        pricePerPerson: Number(pricePerPerson),
        discountPercent: Number(discountPercent) || 0,
        isActive: true,
        items: body.items ? {
          create: body.items.map((i: any) => ({
            menuItemId: i.menuItemId || null,
            customName: i.customName || null,
            customUnit: i.customUnit || null,
            variantId: i.variantId || null,
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unitPrice) || 0,
          }))
        } : undefined,
      },
      include: { items: { include: { menuItem: true } } },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { dealId, items, restart, validDays, ...data } = body;
    if (!dealId) return NextResponse.json({ success: false, message: 'dealId required' }, { status: 400 });

    // If restarting the deal (e.g. 5 days from now)
    if (restart) {
      const durationDays = validDays !== undefined ? Number(validDays) : undefined;
      const deal = await db.deal.update({
        where: { dealId },
        data: {
          startDate: new Date(),
          isActive: true,
          ...(durationDays !== undefined && { validDays: durationDays, timeSlot: `${durationDays} Days` }),
        },
        include: { items: { include: { menuItem: true } } },
      });
      return NextResponse.json({ success: true, data: deal, message: 'Deal restarted successfully' });
    }

    // If items array provided, replace deal items
    if (items !== undefined) {
      await db.dealItem.deleteMany({ where: { dealId } });
    }

    const durationDays = validDays !== undefined ? Number(validDays) : undefined;

    const deal = await db.deal.update({
      where: { dealId },
      data: {
        ...data,
        ...(durationDays !== undefined && { validDays: durationDays }),
        items: items ? {
          create: items.map((i: any) => ({
            menuItemId: i.menuItemId || null,
            customName: i.customName || null,
            customUnit: i.customUnit || null,
            variantId: i.variantId || null,
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
