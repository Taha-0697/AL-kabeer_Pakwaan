import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        userId: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleName: true,
        role: {
          select: {
            roleId: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        roleId: u.role?.roleId || null,
        role: u.role?.name || u.roleName || 'VIEWER',
        roleName: u.role?.name || u.roleName || 'VIEWER',
        roleDescription: u.role?.description || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, roleId, role, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: 'Email, password, and name are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }

    // Match role by roleId if provided, or by role name
    let assignedRoleName = 'VIEWER';
    let matchedRoleId: string | null = null;

    if (roleId) {
      const matchedRole = await db.role.findUnique({ where: { roleId } });
      if (matchedRole) {
        assignedRoleName = matchedRole.name;
        matchedRoleId = matchedRole.roleId;
      }
    } else if (role) {
      const matchedRole = await db.role.findUnique({ where: { name: role } });
      if (matchedRole) {
        assignedRoleName = matchedRole.name;
        matchedRoleId = matchedRole.roleId;
      } else {
        assignedRoleName = role;
      }
    }

    const passwordHash = await hashPassword(password);
    const newUser = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleName: assignedRoleName,
        phone,
        isActive: true,
      },
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
        userId: newUser.userId,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        roleId: newUser.role?.roleId || matchedRoleId,
        role: newUser.role?.name || newUser.roleName || 'VIEWER',
        roleName: newUser.role?.name || newUser.roleName || 'VIEWER',
        roleDescription: newUser.role?.description || null,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
