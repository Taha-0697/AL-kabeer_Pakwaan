import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryItemSchema } from '@/lib/validations/inventory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeType = searchParams.get('storeType') || 'SUPER_STORE';

    const items = await db.inventoryItem.findMany({
      where: { storeType },
      include: { transactions: { take: 5, orderBy: { timestamp: 'desc' } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = inventoryItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const item = await db.inventoryItem.create({ data: result.data });

    await db.inventoryTransaction.create({
      data: {
        itemId: item.itemId,
        storeType: item.storeType,
        txType: 'RESTOCK',
        quantityBefore: 0,
        quantityChanged: item.currentStock,
        quantityAfter: item.currentStock,
        notes: 'Initial Stock Entry',
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
