import { z } from 'zod';

export const bookingItemSchema = z.object({
  menuItemId: z.string().optional(),
  itemName: z.string().optional(),
  category: z.string().default('Rice'),
  unit: z.string().default('Degh'),
  quantity: z.number().min(0.1, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  unitCost: z.number().default(0),
  subtotal: z.number().default(0),
  variantName: z.string().optional(),
  weightKg: z.number().optional(),
});

export const bookingCreateSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  clientCnic: z.string().optional(),
  eventDate: z.string().or(z.date()),
  eventTime: z.string().default('08:00 PM'),
  venue: z.string().min(1, 'Venue is required'),
  guestCount: z.number().int().min(10, 'Minimum guest count is 10'),
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  dealDiscount: z.number().default(0),
  subtotal: z.number().default(0),
  discountAmount: z.number().default(0),
  transportFee: z.number().default(5000),
  taxPercent: z.number().default(13),
  taxAmount: z.number().default(0),
  grandTotal: z.number().default(0),
  notes: z.string().optional(),
  isLabourProvided: z.boolean().default(true),
  items: z.array(bookingItemSchema).min(1, 'Select at least one dish/item'),
});

export const bookingPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.string().default('Cash'),
  notes: z.string().optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
