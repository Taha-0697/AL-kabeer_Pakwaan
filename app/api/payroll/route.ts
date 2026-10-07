import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payroll - list all employees with user link and salary history
export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        user: { select: { userId: true, email: true, roleName: true, isActive: true } },
        salaryPayments: { orderBy: { paidOn: 'desc' }, take: 6 },
        salaryNotices: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// POST /api/payroll - create employee (optionally linked to a user)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, phone, cnic, address, monthlySalary, joiningDate, userId } = body;

    if (!name || !role || !phone) {
      return NextResponse.json({ success: false, message: 'name, role, phone required' }, { status: 400 });
    }

    const employee = await db.employee.create({
      data: { name, role, phone, cnic, address, monthlySalary: monthlySalary || 0, joiningDate: joiningDate ? new Date(joiningDate) : new Date() },
    });

    // If userId provided, link user to this employee
    if (userId) {
      await db.user.update({ where: { userId }, data: { employeeId: employee.employeeId } });
    }

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/payroll - update employee salary/details
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, name, role, phone, cnic, address, monthlySalary, isActive, userId } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'employeeId required' }, { status: 400 });
    }

    const employee = await db.employee.update({
      where: { employeeId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(cnic !== undefined && { cnic }),
        ...(address !== undefined && { address }),
        ...(monthlySalary !== undefined && { monthlySalary }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Link/unlink user
    if (userId !== undefined) {
      if (userId) {
        await db.user.update({ where: { userId }, data: { employeeId: employee.employeeId } });
      }
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
