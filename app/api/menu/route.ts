import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Dish name required'),
  category: z.string().default('Rice'),
  unit: z.string().default('Degh'),
  sellingPrice: z.number().min(0),
  costPrice: z.number().default(0),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  variants: z.array(z.object({
    name: z.string(),
    weightKg: z.number().default(0),
    price: z.number().default(0),
    imageUrl: z.string().optional(),
  })).optional()
});

export async function GET() {
  try {
    const items = await db.menuItem.findMany({
      include: {
        variants: true,
        recipes: {
          include: {
            ingredients: {
              include: { inventoryItem: true },
            },
          },
        },
      },
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
    const result = menuItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const { variants, ...menuData } = result.data;

    const item = await db.menuItem.create({
      data: {
        ...menuData,
        variants: variants ? { create: variants } : undefined
      },
      include: { variants: true }
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { itemId, variants, ...data } = body;
    if (!itemId) return NextResponse.json({ success: false, message: 'itemId required' }, { status: 400 });

    // Delete old variants, recreate
    await db.menuItemVariant.deleteMany({ where: { menuItemId: itemId } });

    const item = await db.menuItem.update({
      where: { itemId },
      data: {
        ...data,
        variants: variants ? { create: variants } : undefined,
      },
      include: { variants: true },
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) return NextResponse.json({ success: false, message: 'itemId required' }, { status: 400 });
    await db.menuItem.delete({ where: { itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
