'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/useAuth';
import {
  UserCheck, Phone, Calendar, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, LogIn, LogOut, Timer,
  AlertCircle, Lock, Unlock, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AttendanceRecord {
  recordId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: number;
  overtimeHours: number;
  status: string;
  bonus: number;
  notes?: string;
  isLocked: boolean;
  approvalStatus: string;
  markedBy?: string;
  requestedChange?: string;
}

interface Employee {
  employeeId: string;
  name: string;
  phone: string;
  role: string;
  monthlySalary: number;
  joiningDate: string;
  isActive: boolean;
  attendanceRecords: AttendanceRecord[];
}

const STATUS_COLOR: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  HALF_DAY: 'warning',
  ON_LEAVE: 'neutral',
};

const APPROVAL_COLOR: Record<string, string> = {
  APPROVED: 'text-emerald-600 dark:text-emerald-400',
  PENDING_APPROVAL: 'text-amber-600 dark:text-amber-400',
  REJECTED: 'text-red-600 dark:text-red-400',
};

function todayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nowISO() {
  return new Date().toISOString();
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN' || isSuperAdmin;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonthStr());
  const [marking, setMarking] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState<Record<string, boolean>>({});

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees').then(r => r.json()),
        fetch(`/api/attendance?month=${month}`).then(r => r.json()),
      ]);

      if (empRes.success && attRes.success) {
        const attByEmp: Record<string, AttendanceRecord[]> = {};
        for (const r of attRes.data) {
          if (!attByEmp[r.employeeId]) attByEmp[r.employeeId] = [];
          attByEmp[r.employeeId].push(r);
        }
        setEmployees(
          empRes.data.map((e: Employee) => ({
            ...e,
            attendanceRecords: attByEmp[e.employeeId] ?? [],
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const markAttendance = async (
    employeeId: string,
    action: 'checkin' | 'checkout' | 'absent' | 'halfday' | 'leave',
    existingRecord?: AttendanceRecord,
  ) => {
    const key = employeeId + action;
    setMarking(m => ({ ...m, [key]: true }));
    try {
      const today = todayStr();
      const payload: Record<string, unknown> = {
        employeeId,
        date: today,
        markedBy: user?.name ?? 'Unknown',
        markerRole: user?.role ?? 'MANAGER',
      };

      if (action === 'checkin') {
        payload.checkInTime = existingRecord?.checkInTime ?? nowISO();
        payload.status = 'PRESENT';
      } else if (action === 'checkout') {
        payload.checkInTime = existingRecord?.checkInTime ?? null;
        payload.checkOutTime = nowISO();
        payload.status = 'PRESENT';
      } else if (action === 'absent') {
        payload.status = 'ABSENT';
      } else if (action === 'halfday') {
        payload.status = 'HALF_DAY';
      } else if (action === 'leave') {
        payload.status = 'ON_LEAVE';
      }

      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchEmployees();
    } finally {
      setMarking(m => ({ ...m, [key]: false }));
    }
  };

  const approveChange = async (recordId: string, action: 'APPROVE' | 'REJECT') => {
    setApproving(a => ({ ...a, [recordId]: true }));
    try {
      await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, action, approvedBy: user?.name }),
      });
      fetchEmployees();
    } finally {
      setApproving(a => ({ ...a, [recordId]: false }));
    }
  };

  return (
    <PageContainer
      title="Employee & Labour Management"
      subtitle="Staff directory, attendance, working hours, salaries, bonus & overtime"
      action={
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <Button variant="outline" size="sm" onClick={fetchEmployees} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} glass className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card glass className="text-center py-12 text-slate-400">
          No employees found. Add employees via Payroll &amp; Salaries.
        </Card>
      ) : (
        <div className="space-y-3">
          {employees.map(emp => {
            const isOpen = expanded === emp.employeeId;
            const records = emp.attendanceRecords;
            const todayRecord = records.find(r => r.date.startsWith(todayStr()));
            const totalHours = records.reduce((s, r) => s + r.hoursWorked, 0);
            const totalOvertime = records.reduce((s, r) => s + r.overtimeHours, 0);
            const totalBonus = records.reduce((s, r) => s + r.bonus, 0);
            const presentDays = records.filter(r => r.status === 'PRESENT').length;
            const absentDays = records.filter(r => r.status === 'ABSENT').length;
            const pendingApprovals = records.filter(r => r.approvalStatus === 'PENDING_APPROVAL');

            return (
              <Card key={emp.employeeId} glass className="space-y-0 p-0 overflow-hidden">
                {/* Employee Header Row */}
                <button
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : emp.employeeId)}
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{emp.name}</h3>
                      <Badge variant={emp.isActive ? 'success' : 'neutral'} className="text-[10px]">{emp.role}</Badge>
                      {todayRecord ? (
                        <Badge variant={STATUS_COLOR[todayRecord.status] ?? 'neutral'} className="text-[10px]">
                          Today: {todayRecord.status}
                        </Badge>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Not marked today</span>
                      )}
                      {pendingApprovals.length > 0 && isSuperAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                          {pendingApprovals.length} pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {new Date(emp.joiningDate).toLocaleDateString()}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">₨ {emp.monthlySalary.toLocaleString()}/mo</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 shrink-0 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{presentDays}</p>
                      <p className="text-slate-400">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-500">{absentDays}</p>
                      <p className="text-slate-400">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-brand-600 dark:text-brand-400">{totalHours.toFixed(1)}h</p>
                      <p className="text-slate-400">Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-amber-600 dark:text-amber-400">{totalOvertime.toFixed(1)}h</p>
                      <p className="text-slate-400">OT</p>
                    </div>
                    {totalBonus > 0 && (
                      <div className="text-center">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">₨{totalBonus.toLocaleString()}</p>
                        <p className="text-slate-400">Bonus</p>
                      </div>
                    )}
                  </div>

                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>

                {/* Expanded Panel */}
                {isOpen && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                    {/* Today's Attendance Actions */}
                    {isManager && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Mark Today&apos;s Attendance — {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'short' })}
                        </p>
                        {todayRecord?.isLocked && !isSuperAdmin ? (
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Attendance for today is locked. Super Admin approval required to change.</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={!!marking[emp.employeeId + 'checkin']}
                              onClick={() => markAttendance(emp.employeeId, 'checkin', todayRecord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              {todayRecord?.checkInTime ? `In: ${fmtTime(todayRecord.checkInTime)}` : 'Check In'}
                            </button>
                            <button
                              disabled={!!marking[emp.employeeId + 'checkout']}
                              onClick={() => markAttendance(emp.employeeId, 'checkout', todayRecord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              {todayRecord?.checkOutTime ? `Out: ${fmtTime(todayRecord.checkOutTime)}` : 'Check Out'}
                            </button>
                            <button
                              onClick={() => markAttendance(emp.employeeId, 'absent', todayRecord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />Absent
                            </button>
                            <button
                              onClick={() => markAttendance(emp.employeeId, 'halfday', todayRecord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                            >
                              <Timer className="h-3.5 w-3.5" />Half Day
                            </button>
                            <button
                              onClick={() => markAttendance(emp.employeeId, 'leave', todayRecord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />On Leave
                            </button>
                          </div>
                        )}

                        {/* Today Summary */}
                        {todayRecord && (
                          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />In: {fmtTime(todayRecord.checkInTime)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Out: {fmtTime(todayRecord.checkOutTime)}</span>
                            {todayRecord.hoursWorked > 0 && (
                              <span className="font-bold text-brand-600 dark:text-brand-400">{todayRecord.hoursWorked.toFixed(2)}h worked</span>
                            )}
                            <span className={clsx('flex items-center gap-1', todayRecord.isLocked ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600')}>
                              {todayRecord.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              {todayRecord.approvalStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Monthly Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { label: 'Salary', val: `₨${emp.monthlySalary.toLocaleString()}`, cls: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Present Days', val: String(presentDays), cls: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Absent Days', val: String(absentDays), cls: 'text-red-500' },
                        { label: 'Total Hours', val: `${totalHours.toFixed(1)}h`, cls: 'text-brand-600 dark:text-brand-400' },
                        { label: 'Overtime', val: `${totalOvertime.toFixed(1)}h`, cls: 'text-purple-600 dark:text-purple-400' },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-2 text-center">
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">{label}</p>
                          <p className={clsx('font-bold text-sm', cls)}>{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pending Approval (Super Admin only) */}
                    {isSuperAdmin && pendingApprovals.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />Pending Approval Requests
                        </p>
                        {pendingApprovals.map(r => (
                          <div key={r.recordId} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="text-xs space-y-0.5">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{new Date(r.date).toLocaleDateString()}</p>
                              <p className="text-slate-500 dark:text-slate-400">{r.requestedChange || 'Attendance change requested'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={!!approving[r.recordId]}
                                onClick={() => approveChange(r.recordId, 'APPROVE')}
                                className="px-2 py-1 text-[10px] rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                disabled={!!approving[r.recordId]}
                                onClick={() => approveChange(r.recordId, 'REJECT')}
                                className="px-2 py-1 text-[10px] rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attendance Log Table */}
                    {records.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Attendance Log — {month}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-2 text-left font-semibold">Date</th>
                                <th className="p-2 text-left font-semibold">Status</th>
                                <th className="p-2 text-left font-semibold">Check In</th>
                                <th className="p-2 text-left font-semibold">Check Out</th>
                                <th className="p-2 text-left font-semibold">Hours</th>
                                <th className="p-2 text-left font-semibold">OT</th>
                                <th className="p-2 text-left font-semibold">Bonus</th>
                                <th className="p-2 text-left font-semibold">Locked</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {records.slice(0, 31).map(r => (
                                <tr key={r.recordId} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="p-2 text-slate-700 dark:text-slate-300 font-medium">
                                    {new Date(r.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={STATUS_COLOR[r.status] ?? 'neutral'} className="text-[10px]">{r.status}</Badge>
                                  </td>
                                  <td className="p-2 text-slate-600 dark:text-slate-400">{fmtTime(r.checkInTime)}</td>
                                  <td className="p-2 text-slate-600 dark:text-slate-400">{fmtTime(r.checkOutTime)}</td>
                                  <td className="p-2 font-bold text-brand-600 dark:text-brand-400">{r.hoursWorked.toFixed(1)}h</td>
                                  <td className="p-2 text-purple-600 dark:text-purple-400">{r.overtimeHours > 0 ? `${r.overtimeHours.toFixed(1)}h` : '—'}</td>
                                  <td className="p-2 text-emerald-600 dark:text-emerald-400">{r.bonus > 0 ? `₨${r.bonus.toLocaleString()}` : '—'}</td>
                                  <td className="p-2">
                                    {r.isLocked ? (
                                      <span className={clsx('flex items-center gap-1', APPROVAL_COLOR[r.approvalStatus] ?? 'text-slate-400')}>
                                        <Lock className="h-3 w-3" />{r.approvalStatus === 'APPROVED' ? 'Locked' : r.approvalStatus}
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                        <Unlock className="h-3 w-3" />Open
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {records.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No attendance records for this month.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
