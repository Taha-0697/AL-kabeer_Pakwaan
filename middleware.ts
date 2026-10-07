import { NextResponse, type NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth/jwt';

const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/openapi', '/openapi.json', '/api/seed-nav'];

const SCREEN_MAP: Record<string, string> = {
  '/':                  'screen:dashboard',
  '/bookings':          'screen:bookings',
  '/bookings/new':      'action:booking_create',
  '/clients':           'screen:clients',
  '/menu':              'screen:menu',
  '/menu/new':          'action:menu_create',
  '/deals':             'screen:deals',
  '/inventory':         'screen:inventory',
  '/crockery':          'screen:crockery',
  '/cashbook':          'screen:cashbook',
  '/employees':         'screen:employees',
  '/users':             'screen:users',
  '/roles':             'screen:roles',
  '/payroll':           'screen:payroll',
  '/settings':          'screen:settings',
  '/settings/business': 'screen:settings',
};

const API_WRITE_MAP: Record<string, string> = {
  '/api/bookings':  'action:booking_create',
  '/api/menu':      'action:menu_create',
  '/api/deals':     'action:deal_create',
  '/api/inventory': 'action:inventory_edit',
  '/api/crockery':  'action:crockery_edit',
  '/api/cashbook':  'action:cashbook_edit',
  '/api/clients':   'action:client_create',
  '/api/employees': 'action:employee_edit',
  '/api/users':     'action:user_edit',
  '/api/roles':     'action:role_edit',
  '/api/payroll':   'action:payroll_edit',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('auth_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (payload.role !== 'SUPER_ADMIN') {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    let requiredPermission: string | undefined;

    if (pathname.startsWith('/api/')) {
      if (isWrite) {
        const key = Object.keys(API_WRITE_MAP)
          .filter((k) => pathname.startsWith(k))
          .sort((a, b) => b.length - a.length)[0];
        requiredPermission = key ? API_WRITE_MAP[key] : undefined;
      }
    } else {
      const key = Object.keys(SCREEN_MAP)
        .filter((k) => pathname === k || (k !== '/' && pathname.startsWith(k)))
        .sort((a, b) => b.length - a.length)[0];
      requiredPermission = key ? SCREEN_MAP[key] : undefined;
    }

    if (requiredPermission) {
      const userPerms: string[] = (payload as any).permissions ?? [];
      if (!userPerms.includes(requiredPermission)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', payload.role);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
