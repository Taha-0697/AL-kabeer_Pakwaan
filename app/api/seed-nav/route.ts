import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/seed-nav — inserts missing nav items & permissions (idempotent)
export async function GET() {
  try {
    const newPermissions = [
      { key: 'screen:payroll', label: 'Payroll & Salaries', category: 'Screen', description: 'View and manage employee payroll and notices' },
      { key: 'screen:roles', label: 'Roles & Permissions', category: 'Screen', description: 'Manage system roles and permission assignments' },
      { key: 'action:payroll_pay', label: 'Pay Salary Button', category: 'Action Button', description: 'Allow recording salary payments' },
      { key: 'action:payroll_notice', label: 'Send Salary Notice', category: 'Action Button', description: 'Allow sending salary notices/advances' },
    ];

    for (const p of newPermissions) {
      await db.permission.upsert({
        where: { key: p.key },
        update: {},
        create: p,
      });
    }

    const newNavItems = [
      { name: 'Payroll', href: '/payroll', icon: 'DollarSign', displayOrder: 10, requiredPermissionKey: 'screen:payroll' },
      { name: 'Roles & Permissions', href: '/roles', icon: 'ShieldCheck', displayOrder: 12, requiredPermissionKey: 'screen:roles' },
    ];

    for (const item of newNavItems) {
      await db.navigationItem.upsert({
        where: { href: item.href },
        update: {},
        create: item,
      });
    }

    // Fix display orders for existing items that might conflict
    await db.navigationItem.updateMany({ where: { href: '/users' }, data: { displayOrder: 11 } });
    await db.navigationItem.updateMany({ where: { href: '/settings/business' }, data: { displayOrder: 13 } });

    return NextResponse.json({ success: true, message: 'Nav items & permissions seeded' });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
