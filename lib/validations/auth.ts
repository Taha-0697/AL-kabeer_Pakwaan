import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  role: z.enum([
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'BOOKING_STAFF',
    'ACCOUNTS_STAFF',
    'INVENTORY_STAFF',
    'VIEWER',
  ]),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
