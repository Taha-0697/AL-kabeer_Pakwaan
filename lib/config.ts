// Centralized Configuration Management for Al-Kabeer Pakwaan Web Portal

export type DbProvider = 'neon' | 'smss' | 'sqlite';

export interface AppConfig {
  env: string;
  port: number;
  appUrl: string;
  db: {
    provider: DbProvider;
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  storage: {
    uploadDir: string;
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
  };
  businessDefaults: {
    taxPercent: number;
    transportFee: number;
    currency: string;
  };
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  db: {
    provider: (process.env.DB_PROVIDER as DbProvider) || 'neon',
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'alkabeer_fallback_secret_key_32bytes_long!!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  },
  businessDefaults: {
    taxPercent: 13.0,
    transportFee: 5000.0,
    currency: 'PKR',
  },
};
