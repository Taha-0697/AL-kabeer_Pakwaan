import { z } from 'zod';

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().optional(),
  unit: z.string().default('Kg'),
  storeType: z.enum(['SUPER_STORE', 'SUB_STORE']).default('SUPER_STORE'),
  currentStock: z.number().default(0),
  minStock: z.number().default(0),
  purchasePrice: z.number().default(0),
  supplier: z.string().optional(),
});

export const inventoryTransferSchema = z.object({
  itemId: z.string().min(1, 'Item required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  notes: z.string().optional(),
});

export const inventoryAdjustmentSchema = z.object({
  itemId: z.string().min(1, 'Item required'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason required'),
  type: z.enum(['MANUAL_ADDITION', 'MANUAL_DEDUCTION', 'WASTE']),
});
