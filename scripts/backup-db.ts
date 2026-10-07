import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

export async function runBackup() {
  console.log('Starting cross-platform SQL backup generation...');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const fileName = `${day}-${month}-${year}.sql`;

  const backupDir = path.resolve(process.cwd(), 'DB_Backups');
  await fs.mkdir(backupDir, { recursive: true });
  const filePath = path.join(backupDir, fileName);

  let sqlDump = `-- Database Backup\n-- Generated on ${now.toISOString()}\n-- Compatible with Postgres (Neon) and SQL Server (SSMS)\n\n`;

  const models = [
    'user', 'role', 'permission', 'rolePermission', 'permissionChangeRequest',
    'navigationItem', 'businessProfile', 'client', 'menuItem', 'menuItemVariant',
    'recipe', 'recipeIngredient', 'inventoryItem', 'inventoryTransaction',
    'deal', 'dealItem', 'booking', 'bookingItem', 'bookingPayment',
    'crockeryItem', 'bookingCrockeryItem', 'cashTransaction', 'employee',
    'attendanceRecord', 'labourAssignment', 'salaryPayment', 'salaryNotice'
  ];

  for (const model of models) {
    try {
      // @ts-ignore
      if (prisma[model]) {
        // @ts-ignore
        const data = await prisma[model].findMany();
        if (data.length > 0) {
          const tableName = model.charAt(0).toUpperCase() + model.slice(1);
          sqlDump += `-- Table: ${tableName}\n`;

          for (const row of data) {
            const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
            const values = Object.values(row).map(formatSqlValue).join(', ');
            sqlDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
          }
          sqlDump += `\n`;
          console.log(`Generated SQL for ${tableName} (${data.length} records)`);
        }
      }
    } catch (err: any) {
      console.error(`Failed to backup ${model}:`, err.message);
    }
  }

  await fs.writeFile(filePath, sqlDump, 'utf8');

  console.log(`\n✅ Cross-platform SQL backup completed!`);
  console.log(`📂 Saved to: ${filePath}`);
}

if (require.main === module) {
  runBackup().then(() => process.exit(0)).catch(e => {
    console.error(e.message);
    process.exit(1);
  });
}