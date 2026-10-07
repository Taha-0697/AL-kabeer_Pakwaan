import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload', errors: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or inactive account' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    const userRole = user.roleName || 'SUPER ADMIN';

    // Load this user's permission keys once at login and bake into the JWT.
    // Middleware can then check permissions without any DB access.
    const roleWithPerms = await db.role.findUnique({
      where: { name: userRole },
      include: { rolePermissions: { include: { permission: true } } },
    });
    const permissions: string[] = (roleWithPerms?.rolePermissions ?? [])
      .map((rp: any) => rp.permission?.key)
      .filter(Boolean);

    const token = await signJWT({
      userId: user.userId,
      email: user.email,
      role: userRole,
      name: user.name,
      permissions,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: userRole,
        phone: user.phone || '',
        token,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
