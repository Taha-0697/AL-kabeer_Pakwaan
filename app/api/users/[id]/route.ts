import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { name, roleId, role, phone, isActive, password } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (password) dataToUpdate.passwordHash = await hashPassword(password);

    // Resolve role by roleId if provided, or by role name
    if (roleId) {
      const matchedRole = await db.role.findUnique({ where: { roleId } });
      if (matchedRole) {
        dataToUpdate.roleName = matchedRole.name;
      }
    } else if (role !== undefined) {
      dataToUpdate.roleName = role;
    }

    const updatedUser = await db.user.update({
      where: { userId },
      data: dataToUpdate,
      select: {
        userId: true,
        email: true,
        name: true,
        roleName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            roleId: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        roleId: updatedUser.role?.roleId || null,
        role: updatedUser.role?.name || updatedUser.roleName || 'VIEWER',
        roleName: updatedUser.role?.name || updatedUser.roleName || 'VIEWER',
        roleDescription: updatedUser.role?.description || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    await db.user.delete({ where: { userId } });
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
