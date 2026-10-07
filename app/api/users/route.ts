import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { userCreateSchema } from '@/lib/validations/auth';

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        userId: true,
        email: true,
        name: true,
        roleName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: users.map((u: any) => ({ ...u, role: u.roleName || 'VIEWER' })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = userCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const { email, password, name, role, phone } = result.data;
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleName: role,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...newUser, role: newUser.roleName || 'VIEWER' },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
