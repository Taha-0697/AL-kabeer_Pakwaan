import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Screens
  { key: 'screen:dashboard', label: 'Dashboard Overview', category: 'Screen', description: 'Access main dashboard KPIs and summary charts' },
  { key: 'screen:bookings', label: 'Event Bookings', category: 'Screen', description: 'View catering orders and event bookings' },
  { key: 'screen:clients', label: 'Client Directory', category: 'Screen', description: 'View client contact info and order history' },
  { key: 'screen:menu', label: 'Menu & Recipes', category: 'Screen', description: 'View dish catalog and recipe formulas' },
  { key: 'screen:deals', label: 'Package Deals', category: 'Screen', description: 'View catering package deals' },
  { key: 'screen:inventory', label: 'Dual Inventory', category: 'Screen', description: 'Access Super Store and Sub Store stock' },
  { key: 'screen:crockery', label: 'Crockery Stock', category: 'Screen', description: 'Access utensils and Daigh stock' },
  { key: 'screen:cashbook', label: 'Cash Book Ledger', category: 'Screen', description: 'View financial cash register ledger' },
  { key: 'screen:employees', label: 'Employees & Attendance', category: 'Screen', description: 'View staff directory and attendance' },
  { key: 'screen:users', label: 'User Control', category: 'Screen', description: 'Access user account and role management' },
  { key: 'screen:settings', label: 'Business Settings', category: 'Screen', description: 'Configure transport rates, petrol formulas, and taxes' },
  // Action Buttons
  { key: 'action:booking_create', label: 'Create Order Button', category: 'Action Button', description: 'Allow creating new catering orders' },
  { key: 'action:booking_payment', label: 'Add Payment Button', category: 'Action Button', description: 'Allow recording client payments' },
  { key: 'action:booking_delete', label: 'Delete Booking Button', category: 'Action Button', description: 'Allow cancelling or deleting bookings' },
  { key: 'action:client_create', label: 'Add Client Button', category: 'Action Button', description: 'Allow creating new client profiles' },
  { key: 'action:menu_edit', label: 'Manage Dishes Button', category: 'Action Button', description: 'Allow adding or editing menu dishes' },
  { key: 'action:deal_edit', label: 'Manage Deals Button', category: 'Action Button', description: 'Allow adding or editing package deals' },
  { key: 'action:inventory_transfer', label: 'Stock Transfer Button', category: 'Action Button', description: 'Allow transferring stock from Super Store to Kitchen' },
  { key: 'action:inventory_restock', label: 'Restock Button', category: 'Action Button', description: 'Allow restocking Super Store inventory' },
  { key: 'action:inventory_adjust', label: 'Manual Adjustment Button', category: 'Action Button', description: 'Allow waste or manual inventory adjustments' },
  { key: 'action:crockery_edit', label: 'Manage Crockery Button', category: 'Action Button', description: 'Allow adding or updating crockery stock' },
  { key: 'action:cashbook_entry', label: 'Cash In/Out Button', category: 'Action Button', description: 'Allow adding manual cash transactions' },
  { key: 'action:employee_edit', label: 'Manage Staff Button', category: 'Action Button', description: 'Allow editing staff salaries and roles' },
  { key: 'action:user_manage', label: 'Manage Accounts Button', category: 'Action Button', description: 'Allow creating/editing user accounts & roles' },
  { key: 'action:business_settings', label: 'Save Settings Button', category: 'Action Button', description: 'Allow updating business transport rates and tax' },
  // Payroll
  { key: 'screen:payroll', label: 'Payroll & Salaries', category: 'Screen', description: 'View and manage employee payroll and notices' },
  { key: 'action:payroll_pay', label: 'Pay Salary Button', category: 'Action Button', description: 'Allow recording employee salary payments' },
  { key: 'action:payroll_notice', label: 'Send Salary Notice', category: 'Action Button', description: 'Allow sending salary notices/advances to employees' },
  // Roles
  { key: 'screen:roles', label: 'Roles & Permissions', category: 'Screen', description: 'Manage system roles and permission assignments' },
];

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full unrestricted system administration access', isSystemRole: true },
  { name: 'ADMIN', description: 'Complete access to catering operations and staff accounts', isSystemRole: true },
  { name: 'MANAGER', description: 'Operational access to bookings, stock, and cashbook', isSystemRole: true },
  { name: 'BOOKING_STAFF', description: 'Access restricted to event reservations and clients', isSystemRole: true },
  { name: 'ACCOUNTS_STAFF', description: 'Access restricted to cash ledger and client payments', isSystemRole: true },
  { name: 'INVENTORY_STAFF', description: 'Access restricted to warehouse and kitchen inventory', isSystemRole: true },
  { name: 'VIEWER', description: 'Read-only access across standard business screens', isSystemRole: true },
];

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard', displayOrder: 1, requiredPermissionKey: 'screen:dashboard' },
  { name: 'Bookings', href: '/bookings', icon: 'CalendarCheck', displayOrder: 2, requiredPermissionKey: 'screen:bookings' },
  { name: 'Clients', href: '/clients', icon: 'Users', displayOrder: 3, requiredPermissionKey: 'screen:clients' },
  { name: 'Menu & Recipes', href: '/menu', icon: 'UtensilsCrossed', displayOrder: 4, requiredPermissionKey: 'screen:menu' },
  { name: 'Deals', href: '/deals', icon: 'Sparkles', displayOrder: 5, requiredPermissionKey: 'screen:deals' },
  { name: 'Dual Inventory', href: '/inventory', icon: 'Boxes', displayOrder: 6, requiredPermissionKey: 'screen:inventory' },
  { name: 'Crockery Stock', href: '/crockery', icon: 'CookingPot', displayOrder: 7, requiredPermissionKey: 'screen:crockery' },
  { name: 'Cash Book', href: '/cashbook', icon: 'Receipt', displayOrder: 8, requiredPermissionKey: 'screen:cashbook' },
  { name: 'Employees & Attendance', href: '/employees', icon: 'UserCheck', displayOrder: 9, requiredPermissionKey: 'screen:employees' },
  { name: 'Payroll', href: '/payroll', icon: 'Receipt', displayOrder: 10, requiredPermissionKey: 'screen:payroll' },
  { name: 'User & Role Control', href: '/users', icon: 'ShieldCheck', displayOrder: 11, requiredPermissionKey: 'screen:users' },
  { name: 'Roles & Permissions', href: '/roles', icon: 'ShieldCheck', displayOrder: 12, requiredPermissionKey: 'screen:roles' },
  { name: 'Business Settings', href: '/settings/business', icon: 'Settings', displayOrder: 13, requiredPermissionKey: 'screen:settings' },
];

async function main() {
  console.log('Seeding Al-Kabeer Pakwaan database with dynamic RBAC & Navigation...');

  // 1. Seed Permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, category: perm.category, description: perm.description },
      create: perm,
    });
  }

  // 2. Seed Roles
  for (const roleData of ROLES) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description, isSystemRole: roleData.isSystemRole },
      create: roleData,
    });
  }

  // 3. Map Roles to Permissions
  const allPerms = await prisma.permission.findMany();
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });

  if (superAdminRole) {
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.roleId, permissionId: perm.permissionId } },
        update: {},
        create: { roleId: superAdminRole.roleId, permissionId: perm.permissionId },
      });
    }
  }

  // 4. Seed Navigation Items
  for (const nav of NAVIGATION_ITEMS) {
    await prisma.navigationItem.upsert({
      where: { href: nav.href },
      update: { name: nav.name, icon: nav.icon, displayOrder: nav.displayOrder, requiredPermissionKey: nav.requiredPermissionKey },
      create: nav,
    });
  }

  // 5. Seed Super Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@alkabeer.com' },
    update: { roleName: 'SUPER_ADMIN' },
    create: {
      email: 'admin@alkabeer.com',
      name: 'Super Admin',
      passwordHash,
      roleName: 'SUPER_ADMIN',
      phone: '+92 300 1234567',
      isActive: true,
    },
  });

  // 6. Business Profile
  await prisma.businessProfile.upsert({
    where: { id: 'business_profile' },
    update: {},
    create: {
      id: 'business_profile',
      name: 'Al-Kabeer Pakwaan & Catering',
      tagline: 'Premium Event Catering & Authentic Cuisine Services',
      address: 'Main Commercial Hub, Gulberg, Lahore, Pakistan',
      phone: '+92 300 9876543',
      whatsapp: '+92 300 9876543',
      email: 'info@alkabeerpakwaan.com',
      defaultTransport: 5000.0,
      baseTransportKm: 10.0,
      perKmRate: 250.0,
      petrolPrice: 280.0,
      vehicleEfficiencyKmPerLitre: 8.0,
      taxName: 'Punjab Sales Tax',
      taxPercent: 13.0,
      taxEnabled: true,
      logoUrl: '/uploads/photos/logo.png',
    },
  });

  // 7. Inventory Items
  const riceInv = await prisma.inventoryItem.upsert({
    where: { sku: 'INV-RICE-01' },
    update: {},
    create: {
      sku: 'INV-RICE-01',
      name: 'Basmati Super Kernel Rice',
      category: 'Grains',
      unit: 'Kg',
      storeType: 'SUPER_STORE',
      currentStock: 500.0,
      minStock: 100.0,
      purchasePrice: 320.0,
      supplier: 'Punjab Rice Mills',
    },
  });

  const chickenInv = await prisma.inventoryItem.upsert({
    where: { sku: 'INV-CHK-01' },
    update: {},
    create: {
      sku: 'INV-CHK-01',
      name: 'Fresh Whole Chicken',
      category: 'Meat',
      unit: 'Kg',
      storeType: 'SUPER_STORE',
      currentStock: 300.0,
      minStock: 50.0,
      purchasePrice: 650.0,
      supplier: 'Kabeer Poultry',
    },
  });

  await prisma.inventoryItem.upsert({
    where: { sku: 'INV-RICE-01-SUB' },
    update: {},
    create: {
      sku: 'INV-RICE-01-SUB',
      name: 'Basmati Super Kernel Rice (Kitchen)',
      category: 'Grains',
      unit: 'Kg',
      storeType: 'SUB_STORE',
      currentStock: 80.0,
      minStock: 20.0,
      purchasePrice: 320.0,
    },
  });

  // 8. Menu & Recipes
  let biryani = await prisma.menuItem.findFirst({ where: { name: 'Special Chicken Biryani (Degh)' } });
  if (!biryani) {
    biryani = await prisma.menuItem.create({
      data: {
        name: 'Special Chicken Biryani (Degh)',
        category: 'Rice',
        unit: 'Degh',
        sellingPrice: 18500.0,
        costPrice: 13000.0,
        description: 'Authentic 12kg Degh with premium basmati rice & chicken',
        chickenPrice: 18500.0,
        beefPrice: 22500.0,
        muttonPrice: 31000.0,
      },
    });

    const recipe = await prisma.recipe.create({
      data: { menuItemId: biryani.itemId, yieldServings: 45 },
    });

    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: recipe.recipeId, inventoryItemId: riceInv.itemId, quantityRequired: 12.0, unit: 'Kg' },
        { recipeId: recipe.recipeId, inventoryItemId: chickenInv.itemId, quantityRequired: 12.0, unit: 'Kg' },
      ],
    });
  }

  // 9. Crockery & Clients
  if ((await prisma.crockeryItem.count()) === 0) {
    await prisma.crockeryItem.createMany({
      data: [
        { name: 'Copper Daigh (12kg)', category: 'Daighs', totalStock: 50, availableQuantity: 50, replacementCost: 35000.0 },
        { name: 'Serving Dishes (Large)', category: 'Serving', totalStock: 200, availableQuantity: 200, replacementCost: 1500.0 },
        { name: 'VIP Soup Bowls', category: 'Crockery', totalStock: 300, availableQuantity: 300, replacementCost: 450.0 },
      ],
    });
  }

  if ((await prisma.client.count()) === 0) {
    await prisma.client.create({
      data: {
        name: 'Tariq Mehmood Chaudhry',
        cnic: '35202-1234567-1',
        phone: '+92 321 5551234',
        whatsapp: '+92 321 5551234',
        email: 'tariq.m@gmail.com',
        address: 'DHA Phase 5, Lahore',
        totalOrders: 2,
        totalSpent: 145000.0,
      },
    });
  }

  console.log('Database seeded with dynamic Roles, Permissions & Navigation successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
