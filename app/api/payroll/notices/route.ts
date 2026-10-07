import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payroll/notices - get notices for an employee
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  try {
    const notices = await db.salaryNotice.findMany({
      where: employeeId ? { employeeId } : {},
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: notices });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// POST /api/payroll/notices - super admin creates a salary notice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, title, message, amount, noticeType } = body;

    if (!employeeId || !title || !message) {
      return NextResponse.json({ success: false, message: 'employeeId, title, message required' }, { status: 400 });
    }

    const notice = await db.salaryNotice.create({
      data: { employeeId, title, message, amount: amount || 0, noticeType: noticeType || 'GENERAL' },
    });

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/payroll/notices - mark notice as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { noticeId } = body;
    const notice = await db.salaryNotice.update({ where: { noticeId }, data: { isRead: true } });
    return NextResponse.json({ success: true, data: notice });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
