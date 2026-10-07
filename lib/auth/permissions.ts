// Granular Role-Based Access Control (RBAC) & Permission Matrix

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'BOOKING_STAFF'
  | 'ACCOUNTS_STAFF'
  | 'INVENTORY_STAFF'
  | 'VIEWER';

export type Permission =
  // Screens
  | 'screen:dashboard'
  | 'screen:bookings'
  | 'screen:clients'
  | 'screen:menu'
  | 'screen:deals'
  | 'screen:inventory'
  | 'screen:crockery'
  | 'screen:cashbook'
  | 'screen:employees'
  | 'screen:users'
  | 'screen:settings'
  // Actions & Buttons
  | 'action:booking_create'
  | 'action:booking_payment'
  | 'action:booking_delete'
  | 'action:client_create'
  | 'action:menu_edit'
  | 'action:deal_edit'
  | 'action:inventory_transfer'
  | 'action:inventory_restock'
  | 'action:inventory_adjust'
  | 'action:crockery_edit'
  | 'action:cashbook_entry'
  | 'action:employee_edit'
  | 'action:user_manage'
  | 'action:business_settings';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:menu', 'screen:deals',
    'screen:inventory', 'screen:crockery', 'screen:cashbook', 'screen:employees', 'screen:users', 'screen:settings',
    'action:booking_create', 'action:booking_payment', 'action:booking_delete', 'action:client_create',
    'action:menu_edit', 'action:deal_edit', 'action:inventory_transfer', 'action:inventory_restock',
    'action:inventory_adjust', 'action:crockery_edit', 'action:cashbook_entry', 'action:employee_edit',
    'action:user_manage', 'action:business_settings',
  ],
  ADMIN: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:menu', 'screen:deals',
    'screen:inventory', 'screen:crockery', 'screen:cashbook', 'screen:employees', 'screen:users',
    'action:booking_create', 'action:booking_payment', 'action:client_create', 'action:menu_edit',
    'action:deal_edit', 'action:inventory_transfer', 'action:inventory_restock', 'action:inventory_adjust',
    'action:crockery_edit', 'action:cashbook_entry', 'action:employee_edit', 'action:user_manage',
  ],
  MANAGER: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:menu', 'screen:deals',
    'action:booking_create', 'action:booking_payment',
  ],
  BOOKING_STAFF: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:menu', 'screen:deals',
    'action:booking_create', 'action:client_create',
  ],
  ACCOUNTS_STAFF: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:cashbook',
    'action:booking_payment', 'action:cashbook_entry',
  ],
  INVENTORY_STAFF: [
    'screen:dashboard', 'screen:inventory', 'screen:crockery', 'screen:menu',
    'action:inventory_transfer', 'action:inventory_restock', 'action:inventory_adjust', 'action:crockery_edit',
  ],
  VIEWER: [
    'screen:dashboard', 'screen:bookings', 'screen:clients', 'screen:menu', 'screen:deals', 'screen:inventory',
  ],
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const userRole = role as UserRole;
  const allowed = ROLE_PERMISSIONS[userRole];
  return allowed ? allowed.includes(permission) : false;
}

export function canAccessScreen(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const screenMap: Record<string, Permission> = {
    '/': 'screen:dashboard',
    '/bookings': 'screen:bookings',
    '/bookings/new': 'action:booking_create',
    '/clients': 'screen:clients',
    '/menu': 'screen:menu',
    '/deals': 'screen:deals',
    '/inventory': 'screen:inventory',
    '/crockery': 'screen:crockery',
    '/cashbook': 'screen:cashbook',
    '/employees': 'screen:employees',
    '/users': 'screen:users',
    '/settings/business': 'screen:settings',
  };

  const requiredPermission = screenMap[path];
  if (!requiredPermission) return true;
  return hasPermission(role, requiredPermission);
}
