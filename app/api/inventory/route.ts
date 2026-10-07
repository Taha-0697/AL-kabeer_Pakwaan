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

    const item = await db.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({ data: result.data });

      await tx.inventoryTransaction.create({
        data: {
          itemId: newItem.itemId,
          storeType: newItem.storeType,
          txType: 'RESTOCK',
          quantityBefore: 0,
          quantityChanged: newItem.currentStock,
          quantityAfter: newItem.currentStock,
          notes: 'Initial Stock Entry',
        },
      });

      if (newItem.currentStock > 0 && newItem.purchasePrice > 0) {
        const cost = newItem.currentStock * newItem.purchasePrice;
        await tx.cashTransaction.create({
          data: {
            txType: 'CASH_OUT',
            category: 'INVENTORY',
            amount: cost,
            paidToFrom: newItem.supplier || 'Supplier',
            comments: `Purchased ${newItem.currentStock} ${newItem.unit} of ${newItem.name}`,
          },
        });
      }

      return newItem;
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { itemId, restockQty, purchasePrice, supplier, notes, ...otherData } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, message: 'itemId is required' }, { status: 400 });
    }

    const existing = await db.inventoryItem.findUnique({ where: { itemId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    const qtyToAdd = Number(restockQty) || 0;
    const pricePerUnit = Number(purchasePrice) !== undefined && Number(purchasePrice) > 0 ? Number(purchasePrice) : existing.purchasePrice;

    const updated = await db.$transaction(async (tx) => {
      const newStock = existing.currentStock + qtyToAdd;
      const item = await tx.inventoryItem.update({
        where: { itemId },
        data: {
          ...otherData,
          currentStock: qtyToAdd > 0 ? newStock : (otherData.currentStock !== undefined ? Number(otherData.currentStock) : existing.currentStock),
          purchasePrice: pricePerUnit,
          supplier: supplier !== undefined ? supplier : existing.supplier,
        },
      });

      if (qtyToAdd > 0) {
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.itemId,
            storeType: item.storeType,
            txType: 'RESTOCK',
            quantityBefore: existing.currentStock,
            quantityChanged: qtyToAdd,
            quantityAfter: item.currentStock,
            notes: notes || 'Stock Restock / Purchase',
          },
        });

        if (pricePerUnit > 0) {
          const totalCost = qtyToAdd * pricePerUnit;
          await tx.cashTransaction.create({
            data: {
              txType: 'CASH_OUT',
              category: 'INVENTORY',
              amount: totalCost,
              paidToFrom: item.supplier || supplier || 'Supplier',
              comments: `Restocked ${qtyToAdd} ${item.unit} of ${item.name}`,
            },
          });
        }
      }

      return item;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
