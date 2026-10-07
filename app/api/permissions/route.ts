import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const permissions = await db.permission.findMany({
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });
    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, label, category } = body;
    const perm = await db.permission.create({
      data: { key, label, category: category || 'General' }
    });
    return NextResponse.json({ success: true, data: perm });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { permissionId, key, label, category } = body;
    const perm = await db.permission.update({
      where: { permissionId },
      data: { key, label, category }
    });
    return NextResponse.json({ success: true, data: perm });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID required');
    await db.permission.delete({ where: { permissionId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
