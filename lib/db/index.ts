import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.env !== 'production') {
  global.prisma = db;
}

export async function getDbHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', provider: config.db.provider };
  } catch (error) {
    return { status: 'unhealthy', error: (error as Error).message };
  }
}
