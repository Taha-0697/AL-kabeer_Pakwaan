import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const roles = await db.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Role name is required' }, { status: 400 });
    }

    const role = await db.role.create({
      data: {
        name,
        description,
        isSystemRole: false,
        rolePermissions: {
          create: (permissionIds || []).map((id: string) => ({ permissionId: id })),
        },
      },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { roleId, description, permissionIds } = body;

    if (!roleId) {
      return NextResponse.json({ success: false, message: 'roleId required' }, { status: 400 });
    }

    // Delete existing permissions for this role & recreate
    await db.rolePermission.deleteMany({ where: { roleId } });

    const role = await db.role.update({
      where: { roleId },
      data: {
        description,
        rolePermissions: {
          create: (permissionIds || []).map((id: string) => ({ permissionId: id })),
        },
      },
      include: { rolePermissions: { include: { permission: true } } },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
