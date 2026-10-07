'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { CookingPot, Plus, RefreshCw, Pencil, Trash2, X, Check } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface CrockeryItem {
  crockeryId: string;
  name: string;
  category: string;
  totalStock: number;
  issuedQuantity: number;
  availableQuantity: number;
  replacementCost: number;
  condition: string;
  notes?: string;
}

const EMPTY_FORM = {
  name: '', category: 'Daighs', totalStock: 0,
  issuedQuantity: 0, availableQuantity: 0,
  replacementCost: 0, condition: 'Good', notes: '',
};

export default function CrockeryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CrockeryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CrockeryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crockery');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  };

  const openEdit = (item: CrockeryItem) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category,
      totalStock: item.totalStock, issuedQuantity: item.issuedQuantity,
      availableQuantity: item.availableQuantity,
      replacementCost: item.replacementCost,
      condition: item.condition, notes: item.notes ?? '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalStock: Number(form.totalStock),
        issuedQuantity: Number(form.issuedQuantity),
        availableQuantity: Number(form.availableQuantity),
        replacementCost: Number(form.replacementCost),
        ...(editing ? { crockeryId: editing.crockeryId } : {}),
      };

      const res = await fetch('/api/crockery', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditing(null);
        fetchItems();
      } else {
        setError(data.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (crockeryId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/crockery?crockeryId=${crockeryId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setItems(items.filter(i => i.crockeryId !== crockeryId));
  };

  // Totals
  const totalStock = items.reduce((s, i) => s + i.totalStock, 0);
  const totalIssued = items.reduce((s, i) => s + i.issuedQuantity, 0);
  const totalAvailable = items.reduce((s, i) => s + i.availableQuantity, 0);

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <PageContainer
      title={t('crockeryStock')}
      subtitle={t('crockerySubtitle')}
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchItems} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            {t('refresh')}
          </Button>
          <PermissionGuard permission="action:crockery_edit">
            <Button variant="gold" size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
              Add Item
            </Button>
          </PermissionGuard>
        </div>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">{t('totalStock')}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalStock}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">{t('issuedToEvents')}</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{totalIssued}</p>
        </Card>
        <Card glass className="space-y-1">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">{t('availableInStore')}</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalAvailable}</p>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} glass className="space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : items.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
              No crockery items. Click &quot;Add Item&quot; to create one.
            </div>
          ) : (
            items.map((c) => (
              <Card key={c.crockeryId} glass className={'space-y-3 transition-all ' + (editing?.crockeryId === c.crockeryId ? 'border-amber-500/60' : '')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CookingPot className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="gold">{c.category}</Badge>
                    <PermissionGuard permission="action:crockery_edit">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.crockeryId, c.name)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>{t('totalStock')}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{c.totalStock} units</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('issuedToEvents')}:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{c.issuedQuantity} units</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('availableInStore')}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{c.availableQuantity} units</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Condition:</span>
                    <span className={c.condition === 'Good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{c.condition}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('replacementCost')}:</span>
                    <span>PKR {c.replacementCost.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Panel */}
        {showForm && (
          <div className="w-[360px] shrink-0">
            <Card glass className="space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-500">{editing ? 'Edit Crockery Item' : 'Add Crockery Item'}</h3>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">{error}</p>}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <Input label="Item Name *" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Copper Daigh (Large)" />
                <Input label="Category" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Daighs / Covers / Trays" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Total Stock" type="number" value={form.totalStock} onChange={e => f('totalStock', e.target.value)} />
                  <Input label="Issued Qty" type="number" value={form.issuedQuantity} onChange={e => f('issuedQuantity', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Available Qty" type="number" value={form.availableQuantity} onChange={e => f('availableQuantity', e.target.value)} />
                  <Input label="Replacement Cost (PKR)" type="number" value={form.replacementCost} onChange={e => f('replacementCost', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={e => f('condition', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => f('notes', e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
                <Button variant="gold" className="w-full" onClick={handleSave} isLoading={saving} leftIcon={<Check className="h-4 w-4" />}>
                  {editing ? 'Update Item' : 'Save Item'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
