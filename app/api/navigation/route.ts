import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth/jwt';
import { headers, cookies } from 'next/headers';

export async function GET() {
  try {
    const navItems = await db.navigationItem.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Read token from cookie (set by auth/login) OR Authorization header
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth_token')?.value;
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken;

    // Default: treat as SUPER_ADMIN only if no token (shouldn't happen in prod)
    let userRole = 'VIEWER';
    let userId: string | undefined;
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        userRole = payload.role;
        userId = payload.userId;
      }
    }

    // Super admin sees everything
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.json({ success: true, data: navItems });
    }

    // Load this user's permission keys from DB
    const user = await db.user.findUnique({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    const userPermKeys = new Set(
      (user?.role?.rolePermissions ?? []).map((rp: any) => rp.permission?.key).filter(Boolean)
    );

    // Only return nav items whose requiredPermissionKey is in userPermKeys
    // Items with no requiredPermissionKey are visible to all authenticated users
    const allowedNav = navItems.filter(
      (item: any) => !item.requiredPermissionKey || userPermKeys.has(item.requiredPermissionKey)
    );

    return NextResponse.json({ success: true, data: allowedNav });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

