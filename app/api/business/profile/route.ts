import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  tagline: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  defaultTransport: z.number().default(5000),
  baseTransportKm: z.number().default(10),
  perKmRate: z.number().default(250),
  petrolPrice: z.number().default(280),
  vehicleEfficiencyKmPerLitre: z.number().default(8),
  taxName: z.string().default('GST'),
  taxPercent: z.number().default(13),
  taxEnabled: z.boolean().default(true),
  logoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const profile = await db.businessProfile.findUnique({
      where: { id: 'business_profile' },
    });
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = businessProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.format() }, { status: 400 });
    }

    const updated = await db.businessProfile.upsert({
      where: { id: 'business_profile' },
      update: result.data,
      create: { id: 'business_profile', ...result.data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
