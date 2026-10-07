import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/attendance?employeeId=xxx&month=2026-10
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month'); // format: YYYY-MM

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const records = await db.attendanceRecord.findMany({
      where,
      include: { employee: { select: { name: true, role: true } } },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// POST /api/attendance — mark attendance (check-in or check-out)
// Once isLocked=true, only SUPER_ADMIN can set approvalStatus=APPROVED to allow edit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId, date, checkInTime, checkOutTime,
      status, notes, overtimeHours, bonus, markedBy, markerRole,
    } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ success: false, message: 'employeeId and date required' }, { status: 400 });
    }

    // Check if record already exists for this employee on this date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await db.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    // Calculate hoursWorked
    let hoursWorked = 0;
    if (checkInTime && checkOutTime) {
      const inMs = new Date(checkInTime).getTime();
      const outMs = new Date(checkOutTime).getTime();
      hoursWorked = Math.max(0, (outMs - inMs) / (1000 * 60 * 60));
    }

    if (existing) {
      // If locked and not a super admin approval, reject
      if (existing.isLocked && markerRole !== 'SUPER_ADMIN') {
        return NextResponse.json({
          success: false,
          message: 'Attendance is locked. Changes require Super Admin approval.',
        }, { status: 403 });
      }

      // Super admin can unlock/update
      const updated = await db.attendanceRecord.update({
        where: { recordId: existing.recordId },
        data: {
          checkInTime: checkInTime ? new Date(checkInTime) : existing.checkInTime,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : existing.checkOutTime,
          hoursWorked,
          overtimeHours: overtimeHours ?? existing.overtimeHours,
          status: status ?? existing.status,
          bonus: bonus ?? existing.bonus,
          notes: notes ?? existing.notes,
          markedBy: markedBy ?? existing.markedBy,
          approvedBy: markerRole === 'SUPER_ADMIN' ? markedBy : existing.approvedBy,
          approvalStatus: markerRole === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL',
          isLocked: true, // always re-lock after mark
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create new record — auto-lock it
    const record = await db.attendanceRecord.create({
      data: {
        employeeId,
        date: new Date(date),
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        hoursWorked,
        overtimeHours: overtimeHours ?? 0,
        status: status ?? 'PRESENT',
        bonus: bonus ?? 0,
        notes,
        markedBy,
        isLocked: true,
        approvalStatus: markerRole === 'SUPER_ADMIN' ? 'APPROVED' : 'APPROVED', // always approved on first mark
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/attendance — super admin approve a change request
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { recordId, approvedBy, action } = body; // action: 'APPROVE' | 'REJECT'

    if (!recordId || !action) {
      return NextResponse.json({ success: false, message: 'recordId and action required' }, { status: 400 });
    }

    const record = await db.attendanceRecord.update({
      where: { recordId },
      data: {
        approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedBy: approvedBy ?? null,
        isLocked: true,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
