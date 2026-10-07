'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/LanguageProvider';
import {
  Users, Plus, X, ChevronRight, Loader2, Bell,
  DollarSign, Calendar, CheckCircle, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

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

  // Add employee form
  const [form, setForm] = useState({ name: '', role: '', phone: '', cnic: '', address: '', monthlySalary: '', userId: '' });

  // Pay salary form
  const [payForm, setPayForm] = useState({ month: '', amount: '', notes: '' });

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
    if (emp && p === 'pay-salary') {
      setPayForm({ month: '', amount: emp.monthlySalary.toString(), notes: '' });
    }
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
      body: JSON.stringify({ employeeId: selected.employeeId, month: payForm.month, amount: Number(payForm.amount), notes: payForm.notes, isPaid: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setPanel(null); fetchAll(); }
    else setError(data.message || 'Failed');
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
      subtitle="Employee payroll, salary payments, and super admin notices"
      action={
        <Button variant="gold" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openPanel('add-employee')}>
          {t('addEmployee')}
        </Button>
      }
    >
      {/* KPI Strip */}
      <div className={clsx('grid grid-cols-2 md:grid-cols-3 gap-4 mb-6', isRTL && 'direction-rtl')}>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-400">{t('employees')}</p>
          <p className="text-2xl font-bold text-white">{activeCount}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-400">Monthly Payroll</p>
          <p className="text-2xl font-bold text-amber-400">₨ {totalPayroll.toLocaleString()}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs text-slate-400">Linked to Users</p>
          <p className="text-2xl font-bold text-brand-400">{employees.filter(e => e.user).length}</p>
        </Card>
      </div>

      <div className={clsx('flex gap-6', isRTL && 'flex-row-reverse')}>
        {/* ── Employee List ────────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : employees.length === 0 ? (
            <Card glass className="text-center py-12 text-slate-400">{t('noData')}</Card>
          ) : employees.map(emp => (
            <Card
              key={emp.employeeId}
              glass
              className={clsx(
                'flex items-center gap-4 cursor-pointer hover:border-amber-500/40 transition-all',
                selected?.employeeId === emp.employeeId && panel !== 'add-employee' && 'border-amber-500/50 bg-amber-500/5',
                isRTL && 'flex-row-reverse'
              )}
              onClick={() => openPanel('view-employee', emp)}
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={clsx('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <h3 className="font-bold text-slate-100 text-sm">{emp.name}</h3>
                  {emp.user && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-600/20 text-brand-400">Portal User</span>}
                  {!emp.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{t('inactive')}</span>}
                </div>
                <p className="text-xs text-slate-400">{emp.role} · {emp.phone}</p>
              </div>
              <div className={clsx('text-right shrink-0', isRTL && 'text-left')}>
                <p className="text-sm font-bold text-amber-400">₨ {emp.monthlySalary.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">/month</p>
              </div>
              <div className={clsx('flex gap-1 shrink-0', isRTL && 'flex-row-reverse')}>
                <button
                  onClick={e => { e.stopPropagation(); openPanel('pay-salary', emp); }}
                  className="px-2 py-1 text-[10px] rounded-lg bg-brand-600/20 text-brand-400 hover:bg-brand-600/40 font-semibold transition-colors"
                >
                  {t('markPaid')}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); openPanel('add-notice', emp); }}
                  className="px-2 py-1 text-[10px] rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 font-semibold transition-colors"
                >
                  <Bell className="h-3 w-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Side Panel ──────────────────────────────────────── */}
        {panel && (
          <div className={clsx('w-[380px] shrink-0', isRTL && 'order-first')}>
            <Card glass className="space-y-4 sticky top-4">

              {/* Add Employee */}
              {panel === 'add-employee' && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <h3 className="font-bold text-slate-100">{t('addEmployee')}</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Input label={t('name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <Input label={t('role')} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Cook, Waiter, Driver" />
                  <Input label={t('phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input label="CNIC" value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} />
                  <Input label={t('monthlySalary')} type="number" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Link to Portal User (optional)</label>
                    <select
                      value={form.userId}
                      onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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

              {/* Pay Salary */}
              {panel === 'pay-salary' && selected && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <div>
                      <h3 className="font-bold text-slate-100">{t('markPaid')} — {selected.name}</h3>
                      <p className="text-xs text-slate-400">Monthly Salary: ₨ {selected.monthlySalary.toLocaleString()}</p>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Input label="Month (e.g. October 2026)" value={payForm.month} onChange={e => setPayForm(f => ({ ...f, month: e.target.value }))} />
                  <Input label={t('amount')} type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                  <Input label={t('notes')} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
                  <Button variant="gold" className="w-full" onClick={paySalary} isLoading={saving}>{t('save')}</Button>

                  {/* History */}
                  {selected.salaryPayments.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('salaryHistory')}</p>
                      {selected.salaryPayments.map(p => (
                        <div key={p.paymentId} className={clsx('flex items-center justify-between text-xs', isRTL && 'flex-row-reverse')}>
                          <span className="text-slate-300">{p.month}</span>
                          <span className="text-amber-400 font-semibold">₨ {p.amount.toLocaleString()}</span>
                          {p.isPaid ? <CheckCircle className="h-3.5 w-3.5 text-brand-400" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
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
                      <h3 className="font-bold text-slate-100">{t('addNotice')} — {selected.name}</h3>
                      <p className="text-xs text-slate-400">Super Admin notice to employee</p>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                    <select
                      value={noticeForm.noticeType}
                      onChange={e => setNoticeForm(f => ({ ...f, noticeType: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="GENERAL">General Notice</option>
                      <option value="ADVANCE">Salary Advance</option>
                      <option value="BONUS">Bonus</option>
                      <option value="DEDUCTION">Deduction</option>
                    </select>
                  </div>
                  <Input label="Title" value={noticeForm.title} onChange={e => setNoticeForm(f => ({ ...f, title: e.target.value }))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                    <textarea
                      value={noticeForm.message}
                      onChange={e => setNoticeForm(f => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                  <Input label="Amount (optional)" type="number" value={noticeForm.amount} onChange={e => setNoticeForm(f => ({ ...f, amount: e.target.value }))} />
                  <Button variant="gold" className="w-full" onClick={addNotice} isLoading={saving}>{t('save')}</Button>

                  {/* Existing notices */}
                  {selected.salaryNotices.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Recent Notices</p>
                      {selected.salaryNotices.slice(0, 3).map(n => (
                        <div key={n.noticeId} className="p-2 rounded-lg bg-slate-800/50 space-y-0.5">
                          <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                            <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                            <span className={clsx(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                              n.noticeType === 'BONUS' ? 'bg-brand-600/20 text-brand-400' :
                              n.noticeType === 'DEDUCTION' ? 'bg-red-500/20 text-red-400' :
                              n.noticeType === 'ADVANCE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                            )}>{n.noticeType}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* View Employee */}
              {panel === 'view-employee' && selected && (
                <>
                  <div className={clsx('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                    <h3 className="font-bold text-slate-100">{selected.name}</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-400">{t('role')}</span>
                      <span className="text-slate-200 font-medium">{selected.role}</span>
                    </div>
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-400">{t('phone')}</span>
                      <span className="text-slate-200">{selected.phone}</span>
                    </div>
                    {selected.cnic && (
                      <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                        <span className="text-slate-400">CNIC</span>
                        <span className="text-slate-200">{selected.cnic}</span>
                      </div>
                    )}
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-400">{t('monthlySalary')}</span>
                      <span className="text-amber-400 font-bold">₨ {selected.monthlySalary.toLocaleString()}</span>
                    </div>
                    <div className={clsx('flex justify-between', isRTL && 'flex-row-reverse')}>
                      <span className="text-slate-400">{t('joiningDate')}</span>
                      <span className="text-slate-200">{new Date(selected.joiningDate).toLocaleDateString()}</span>
                    </div>
                    {selected.user && (
                      <div className="p-2 rounded-lg bg-brand-600/10 border border-brand-600/20">
                        <p className="text-xs text-brand-400 font-semibold">Portal User Linked</p>
                        <p className="text-xs text-slate-300">{selected.user.email} · {selected.user.roleName}</p>
                      </div>
                    )}
                  </div>
                  <div className={clsx('flex gap-2', isRTL && 'flex-row-reverse')}>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openPanel('pay-salary', selected)}>{t('markPaid')}</Button>
                    <Button variant="gold" size="sm" className="flex-1" onClick={() => openPanel('add-notice', selected)}><Bell className="h-3.5 w-3.5 me-1" />{t('notice')}</Button>
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
