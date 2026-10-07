import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const crockerySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().default('Daighs'),
  totalStock: z.number().int().min(0).default(0),
  issuedQuantity: z.number().int().min(0).default(0),
  availableQuantity: z.number().int().min(0).default(0),
  replacementCost: z.number().min(0).default(0),
  condition: z.string().default('Good'),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const items = await db.crockeryItem.findMany({
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
    const result = crockerySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }
    const item = await db.crockeryItem.create({ data: result.data });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { crockeryId, ...rest } = body;
    if (!crockeryId) {
      return NextResponse.json({ success: false, message: 'crockeryId required' }, { status: 400 });
    }
    const result = crockerySchema.partial().safeParse(rest);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }
    const item = await db.crockeryItem.update({
      where: { crockeryId },
      data: result.data,
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crockeryId = searchParams.get('crockeryId');
    if (!crockeryId) {
      return NextResponse.json({ success: false, message: 'crockeryId required' }, { status: 400 });
    }
    await db.crockeryItem.delete({ where: { crockeryId } });
    return NextResponse.json({ success: true, message: 'Crockery item deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
