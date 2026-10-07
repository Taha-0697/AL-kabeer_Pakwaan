import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryTransferSchema } from '@/lib/validations/inventory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = inventoryTransferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const { itemId, quantity, notes } = result.data;
    const superItem = await db.inventoryItem.findUnique({ where: { itemId } });

    if (!superItem || superItem.storeType !== 'SUPER_STORE') {
      return NextResponse.json({ success: false, message: 'Super store item not found' }, { status: 404 });
    }

    if (superItem.currentStock < quantity) {
      return NextResponse.json(
        { success: false, message: `Insufficient stock in Super Store. Available: ${superItem.currentStock}` },
        { status: 400 }
      );
    }

    // 1. Deduct from Super Store
    const updatedSuper = await db.inventoryItem.update({
      where: { itemId },
      data: { currentStock: superItem.currentStock - quantity },
    });

    await db.inventoryTransaction.create({
      data: {
        itemId: superItem.itemId,
        storeType: 'SUPER_STORE',
        txType: 'TRANSFER_OUT',
        quantityBefore: superItem.currentStock,
        quantityChanged: -quantity,
        quantityAfter: updatedSuper.currentStock,
        notes: notes || 'Transferred to Sub Store (Kitchen)',
      },
    });

    // 2. Add to Sub Store (find existing or create)
    const subSku = `${superItem.sku || superItem.itemId}-SUB`;
    let subItem = await db.inventoryItem.findFirst({
      where: { sku: subSku, storeType: 'SUB_STORE' },
    });

    if (!subItem) {
      subItem = await db.inventoryItem.create({
        data: {
          sku: subSku,
          name: `${superItem.name} (Kitchen)`,
          category: superItem.category,
          unit: superItem.unit,
          storeType: 'SUB_STORE',
          currentStock: quantity,
          minStock: superItem.minStock,
          purchasePrice: superItem.purchasePrice,
        },
      });
    } else {
      subItem = await db.inventoryItem.update({
        where: { itemId: subItem.itemId },
        data: { currentStock: subItem.currentStock + quantity },
      });
    }

    await db.inventoryTransaction.create({
      data: {
        itemId: subItem.itemId,
        storeType: 'SUB_STORE',
        txType: 'TRANSFER_IN',
        quantityBefore: subItem.currentStock - quantity,
        quantityChanged: quantity,
        quantityAfter: subItem.currentStock,
        notes: notes || 'Received from Super Store',
      },
    });

    return NextResponse.json({ success: true, data: { superItem: updatedSuper, subItem } });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
