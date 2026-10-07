import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { translations } from '@/lib/i18n';

export async function GET() {
  try {
    let items = await db.localization.findMany({
      orderBy: { key: 'asc' },
    });

    // Auto-seed if empty
    if (items.length === 0) {
      const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];
      const initialData = enKeys.map((k) => ({
        key: k,
        en: translations.en[k] || k,
        ur: translations.ur[k] || translations.en[k] || k,
        category: 'general',
      }));

      await db.localization.createMany({
        data: initialData,
        skipDuplicates: true,
      });

      items = await db.localization.findMany({
        orderBy: { key: 'asc' },
      });
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, en, ur, category } = body;

    if (!key || !en || !ur) {
      return NextResponse.json(
        { success: false, message: 'key, en, and ur are required' },
        { status: 400 }
      );
    }

    const item = await db.localization.upsert({
      where: { key },
      update: { en, ur, category: category || 'general' },
      create: { key, en, ur, category: category || 'general' },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
