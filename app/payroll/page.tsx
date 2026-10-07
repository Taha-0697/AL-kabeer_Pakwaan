'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/LanguageProvider';
import {
  Users, Plus, X, ChevronRight, Loader2, Bell,
  DollarSign, Calendar, CheckCircle, AlertCircle, Calculator,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface SalaryPayment {
  paymentId: string;
  month: string;
  amount: number;
  isPaid: boolean;
  paidOn: string;
  notes?: string;
}

interface SalaryNotice {
  noticeId: string;
  title: string;
  message: string;
  amount: number;
  noticeType: string;
  isRead: boolean;
  createdAt: string;
}

interface Employee {
  employeeId: string;
  name: string;
  role: string;
  phone: string;
  cnic?: string;
  address?: string;
  monthlySalary: number;
  joiningDate: string;
  isActive: boolean;
  user?: { userId: string; email: string; roleName: string | null; isActive: boolean } | null;
  salaryPayments: SalaryPayment[];
  salaryNotices: SalaryNotice[];
}

interface UserOption {
  userId: string;
  name: string;
  email: string;
  roleName: string | null;
}

type Panel = 'add-employee' | 'pay-salary' | 'add-notice' | 'view-employee' | null;

export default function PayrollPage() {
  const { t, isRTL } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attCalculating, setAttCalculating] = useState(false);
  const [attStats, setAttStats] = useState<{ present: number; halfDay: number; overtimeHours: number; bonus: number; totalDays: number } | null>(null);

  // Add employee form
  const [form, setForm] = useState({ name: '', role: '', phone: '', cnic: '', address: '', monthlySalary: '', userId: '' });

  // Pay salary form
  const [payForm, setPayForm] = useState({ month: '', amount: '', notes: '', isPaid: true });

  // Notice form
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', amount: '', noticeType: 'GENERAL' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [empRes, usersRes] = await Promise.all([
      fetch('/api/payroll').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]);
    if (empRes.success) setEmployees(empRes.data);
    if (usersRes.success) setUsers(usersRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openPanel = (p: Panel, emp?: Employee) => {
    setError('');
    setSelected(emp || null);
    setPanel(p);
    setAttStats(null);
    if (emp && p === 'pay-salary') {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      setPayForm({
        month: defaultMonth,
        amount: String(emp.monthlySalary),
        notes: 'Full Salary',
        isPaid: true,
      });
    }
  };

  const calculateFromAttendance = async () => {
    if (!selected) return;
    setAttCalculating(true);
    try {
      const now = new Date();
      const mStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/attendance?employeeId=${selected.employeeId}&month=${mStr}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const records = data.data;
        const present = records.filter((r: any) => r.status === 'PRESENT').length;
        const halfDay = records.filter((r: any) => r.status === 'HALF_DAY').length;
        const overtimeHours = records.reduce((s: number, r: any) => s + (r.overtimeHours || 0), 0);
        const bonus = records.reduce((s: number, r: any) => s + (r.bonus || 0), 0);
        const totalDays = 30;

        const effectiveDays = present + (halfDay * 0.5);
        const perDay = selected.monthlySalary / totalDays;
        const hourlyRate = (selected.monthlySalary / (30 * 8));
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const calculatedSalary = Math.round((effectiveDays * perDay) + overtimePay + bonus);

        setAttStats({ present, halfDay, overtimeHours, bonus, totalDays });
        setPayForm(f => ({
          ...f,
          amount: String(calculatedSalary),
          notes: `Attendance: ${effectiveDays} days present (${present} full, ${halfDay} half), ${overtimeHours}h OT, PKR ${bonus} bonus`,
        }));
      }
    } catch {
      setError('Failed to fetch attendance');
    } finally {
      setAttCalculating(false);
    }
  };

  const setFullSalary = () => {
    if (!selected) return;
    setPayForm(f => ({
      ...f,
      amount: String(selected.monthlySalary),
      notes: 'Full Salary (100%)',
    }));
    setAttStats(null);
  };

  const setHalfSalary = () => {
    if (!selected) return;
    setPayForm(f => ({
      ...f,
      amount: String(Math.round(selected.monthlySalary / 2)),
      notes: 'Half Salary (50%)',
    }));
    setAttStats(null);
  };

  const addEmployee = async () => {
    setError('');
    if (!form.name || !form.role || !form.phone) { setError('Name, role, phone required'); return; }
    setSaving(true);
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monthlySalary: Number(form.monthlySalary) || 0 }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setPanel(null); setForm({ name: '', role: '', phone: '', cnic: '', address: '', monthlySalary: '', userId: '' }); fetchAll(); }
    else setError(data.message || 'Failed');
  };

  const paySalary = async () => {
    if (!selected) return;
    setError('');
    if (!payForm.month || !payForm.amount) { setError('Month and amount required'); return; }
    setSaving(true);
    const res = await fetch('/api/payroll/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: selected.employeeId,
        month: payForm.month,
        amount: Number(payForm.amount),
        notes: payForm.notes,
        isPaid: payForm.isPaid,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setPanel(null); fetchAll(); }
    else setError(data.message || 'Failed');
  };

  const markExistingPaymentPaid = async (paymentId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/payroll/pay', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, isPaid: true }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const addNotice = async () => {
    if (!selected) return;
    setError('');
    if (!noticeForm.title || !noticeForm.message) { setError('Title and message required'); return; }
    setSaving(true);
    const res = await fetch('/api/payroll/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: selected.employeeId, ...noticeForm, amount: Number(noticeForm.amount) || 0 }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setPanel(null); setNoticeForm({ title: '', message: '', amount: '', noticeType: 'GENERAL' }); fetchAll(); }
    else setError(data.message || 'Failed');
  };

  // Stats
  const totalPayroll = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const activeCount = employees.filter(e => e.isActive).length;

  return (
    <PageContainer
      title={t('payroll')}
      subtitle="Employee payroll, attendance-based salary calculations, and cash ledger debits"
      action={
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>
              Attendance &amp; Hours
            </Button>
          </Link>
          <Button variant="gold" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openPanel('add-employee')}>
            {t('addEmployee')}
          </Button>
        </div>
      }
    >
      {/* KPI Strip */}
      <div className={clsx('grid grid-cols-2 md:grid-cols-3 gap-4 mb-6', isRTL && 'direction-rtl')}>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('employees')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Payroll</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₨ {totalPayroll.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Linked to Users</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{employees.filter(e => e.user).length}</p>
        </Card>
      </div>

      <div className={clsx('flex flex-col lg:flex-row gap-6', isRTL && 'flex-row-reverse')}>
        {/* ── Employee List ────────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} glass className="flex items-center gap-4 animate-pulse">
                <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-1 text-right shrink-0">
                  <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 ml-auto" />
                  <div className="h-2 w-12 rounded bg-slate-200 dark:bg-slate-700 ml-auto" />
                </div>
              </Card>
            ))
          ) : employees.length === 0 ? (
            <Card glass className="text-center py-12 text-slate-400">{t('noData')}</Card>
          ) : employees.map(emp => {
            const latestPayment = emp.salaryPayments && emp.salaryPayments.length > 0 ? emp.salaryPayments[0] : null;

            return (
              <Card
                key={emp.employeeId}
                glass
                className={clsx(
                  'flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer hover:border-amber-500/40 transition-all p-4',
                  selected?.employeeId === emp.employeeId && panel !== 'add-employee' && 'border-amber-500/50 bg-amber-500/5',
                  isRTL && 'flex-row-reverse'
                )}
                onClick={() => openPanel('view-employee', emp)}
              >
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={clsx('flex items-center gap-2 flex-wrap', isRTL && 'flex-row-reverse')}>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{emp.name}</h3>
                      {emp.user && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-600/20 text-brand-600 dark:text-brand-400 font-semibold">Portal User</span>}
                      {!emp.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 font-semibold">{t('inactive')}</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{emp.role} · {emp.phone}</p>
                  </div>
                </div>

                <div className="flex-1 w-full md:w-auto flex items-center justify-between md:justify-end gap-4">
                  {latestPayment ? (
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{latestPayment.month}:</span>
                        {latestPayment.isPaid ? (
                          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle className="h-3 w-3" /> Already Paid (₨ {latestPayment.amount.toLocaleString()})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markExistingPaymentPaid(latestPayment.paymentId);
                            }}
                            className="bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px]"
                          >
                            <AlertCircle className="h-3 w-3" /> Pending (₨ {latestPayment.amount.toLocaleString()}) - Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className={clsx('text-right shrink-0', isRTL && 'text-left')}>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">₨ {emp.monthlySalary.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Base /month</p>
                  </div>

                  <div className={clsx('flex gap-1 shrink-0', isRTL && 'flex-row-reverse')}>
                    <button
                      onClick={e => { e.stopPropagation(); openPanel('pay-salary', emp); }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Pay / Calculate
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); openPanel('add-notice', emp); }}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
                      title="Send Notice / Advance"
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Side Panel ──────────────────────────────────────── */}
        {panel && (
          <div className={clsx('w-full lg:w-[420px] shrink-0', isRTL && 'order-first')}>
            <Card glass className="space-y-4 sticky top-4">

              {/* Add Employee */}
              {panel === 'add-employee' && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('addEmployee')}</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Input label={t('name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  <Input label={t('role')} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Head Chef, Waiter, Driver" required />
                  <Input label={t('phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                  <Input label="CNIC" value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} />
                  <Input label={t('monthlySalary')} type="number" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} placeholder="e.g. 45000" />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Link to Portal User (optional)</label>
                    <select
                      value={form.userId}
                      onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— No Link —</option>
                      {users.filter(u => !employees.find(e => e.user?.userId === u.userId)).map(u => (
                        <option key={u.userId} value={u.userId}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <Button variant="gold" className="w-full" onClick={addEmployee} isLoading={saving}>{t('save')}</Button>
                </>
              )}

              {/* Pay Salary & Calculator */}
              {panel === 'pay-salary' && selected && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('markPaid')} — {selected.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Base Salary: ₨ {selected.monthlySalary.toLocaleString()}/month</p>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}

                  {/* Super Admin Quick Modifiers */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Salary Calculation Presets</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={setFullSalary}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center border border-emerald-500/20 transition-all"
                      >
                        Full (100%)
                      </button>
                      <button
                        type="button"
                        onClick={setHalfSalary}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold text-center border border-blue-500/20 transition-all"
                      >
                        Half (50%)
                      </button>
                      <button
                        type="button"
                        onClick={calculateFromAttendance}
                        disabled={attCalculating}
                        className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold text-center border border-purple-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        {attCalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
                        Attendance
                      </button>
                    </div>

                    {attStats && (
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 space-y-0.5">
                        <div className="flex justify-between"><span>Present Days:</span><span className="font-bold">{attStats.present} Full / {attStats.halfDay} Half</span></div>
                        <div className="flex justify-between"><span>Overtime Hours:</span><span className="font-bold">{attStats.overtimeHours} hrs</span></div>
                        {attStats.bonus > 0 && <div className="flex justify-between"><span>Bonus:</span><span className="font-bold">₨ {attStats.bonus.toLocaleString()}</span></div>}
                      </div>
                    )}
                  </div>

                  <Input label="Salary Month" value={payForm.month} onChange={e => setPayForm(f => ({ ...f, month: e.target.value }))} placeholder="e.g. October 2026" required />
                  <Input label="Payout Amount (PKR)" type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
                  <Input label={t('notes')} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes, bonus breakdown, deductions" />

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs">
                    <input
                      type="checkbox"
                      id="isPaidCheck"
                      checked={payForm.isPaid}
                      onChange={e => setPayForm(f => ({ ...f, isPaid: e.target.checked }))}
                      className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <label htmlFor="isPaidCheck" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      Mark as Paid &amp; Debit Cashbook Ledger (Cash Out)
                    </label>
                  </div>

                  <Button variant="gold" className="w-full" onClick={paySalary} isLoading={saving}>
                    {payForm.isPaid ? 'Pay Salary & Log to Cashbook' : 'Record Salary Slip (Pending)'}
                  </Button>

                  {/* History */}
                  {selected.salaryPayments.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('salaryHistory')}</p>
                      {selected.salaryPayments.map(p => (
                        <div key={p.paymentId} className={clsx('flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50', isRTL && 'flex-row-reverse')}>
                          <div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold">{p.month}</p>
                            <p className="text-[10px] text-slate-400">{new Date(p.paidOn).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-600 dark:text-amber-400 font-bold block">₨ {p.amount.toLocaleString()}</span>
                            {p.isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-0.5 justify-end">
                                <CheckCircle className="h-3 w-3" /> Already Paid
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markExistingPaymentPaid(p.paymentId)}
                                className="text-amber-500 hover:underline font-bold text-[10px] flex items-center gap-0.5 justify-end"
                              >
                                <AlertCircle className="h-3 w-3" /> Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Add Notice */}
              {panel === 'add-notice' && selected && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('addNotice')} — {selected.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin notice / advance / bonus</p>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                    <select
                      value={noticeForm.noticeType}
                      onChange={e => setNoticeForm(f => ({ ...f, noticeType: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="GENERAL">General Notice</option>
                      <option value="ADVANCE">Salary Advance</option>
                      <option value="BONUS">Bonus</option>
                      <option value="DEDUCTION">Deduction</option>
                    </select>
                  </div>
                  <Input label="Title" value={noticeForm.title} onChange={e => setNoticeForm(f => ({ ...f, title: e.target.value }))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message</label>
                    <textarea
                      value={noticeForm.message}
                      onChange={e => setNoticeForm(f => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                  <Input label="Amount (optional)" type="number" value={noticeForm.amount} onChange={e => setNoticeForm(f => ({ ...f, amount: e.target.value }))} />
                  <Button variant="gold" className="w-full" onClick={addNotice} isLoading={saving}>{t('save')}</Button>
                </>
              )}

              {/* View Employee */}
              {panel === 'view-employee' && selected && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{selected.name}</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-500 dark:text-slate-400">{t('role')}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{selected.role}</span>
                    </div>
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-500 dark:text-slate-400">{t('phone')}</span>
                      <span className="text-slate-800 dark:text-slate-200">{selected.phone}</span>
                    </div>
                    {selected.cnic && (
                      <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                        <span className="text-slate-500 dark:text-slate-400">CNIC</span>
                        <span className="text-slate-800 dark:text-slate-200">{selected.cnic}</span>
                      </div>
                    )}
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-500 dark:text-slate-400">{t('monthlySalary')}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">₨ {selected.monthlySalary.toLocaleString()}</span>
                    </div>
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-500 dark:text-slate-400">{t('joiningDate')}</span>
                      <span className="text-slate-800 dark:text-slate-200">{new Date(selected.joiningDate).toLocaleDateString()}</span>
                    </div>
                    {selected.user && (
                      <div className="p-2 rounded-lg bg-brand-600/10 border border-brand-600/20">
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Portal User Linked</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{selected.user.email} · {selected.user.roleName}</p>
                      </div>
                    )}
                  </div>
                  <div className={clsx('flex gap-2 pt-2', isRTL && 'flex-row-reverse')}>
                    <Button variant="gold" size="sm" className="flex-1" onClick={() => openPanel('pay-salary', selected)}>Pay / Calculate</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openPanel('add-notice', selected)}><Bell className="h-3.5 w-3.5 me-1" />{t('notice')}</Button>
                  </div>
                </>
              )}

            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
