'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Sparkles, Plus, RefreshCw, Pencil, Trash2, X, Check,
  Users, Clock, UtensilsCrossed, PlusCircle, RotateCcw, Calendar,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useLanguage } from '@/components/LanguageProvider';

interface Variant {
  variantId: string;
  name: string;
  weightKg: number;
  price: number;
}

interface MenuItem {
  itemId: string;
  name: string;
  unit: string;
  sellingPrice: number;
  variants?: Variant[];
}

interface DealItem {
  id?: string;
  menuItemId?: string | null;
  customName?: string | null;
  customUnit?: string | null;
  variantId?: string | null;
  quantity: number;
  unitPrice?: number;
  menuItem?: MenuItem | null;
}

interface Deal {
  dealId: string;
  title: string;
  description?: string;
  pricePerPerson: number;
  minPersons: number;
  maxPersons: number;
  discountPercent: number;
  timeSlot: string;
  validDays: number;
  startDate: string;
  createdAt: string;
  isActive: boolean;
  items: DealItem[];
}

export default function DealsPage() {
  const { t } = useLanguage();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Deal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [minPersons, setMinPersons] = useState(50);
  const [maxPersons, setMaxPersons] = useState(500);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validDays, setValidDays] = useState(5);
  const [timeSlot, setTimeSlot] = useState('5 Days Validity');
  const [dealItems, setDealItems] = useState<DealItem[]>([]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, mr] = await Promise.all([fetch('/api/deals'), fetch('/api/menu')]);
      const [dd, md] = await Promise.all([dr.json(), mr.json()]);
      if (dd.success) setDeals(dd.data);
      if (md.success) setMenuItems(md.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setPricePerPerson(0);
    setMinPersons(50); setMaxPersons(500); setDiscountPercent(0);
    setValidDays(5); setTimeSlot('5 Days Validity'); setDealItems([]);
  };

  const openAdd = () => {
    resetForm();
    if (menuItems.length > 0) {
      const first = menuItems[0];
      setDealItems([{
        menuItemId: first.itemId,
        quantity: 1,
        variantId: first.variants && first.variants.length > 0 ? first.variants[0].variantId : null,
        unitPrice: first.variants && first.variants.length > 0 ? first.variants[0].price : first.sellingPrice,
      }]);
    }
    setEditTarget(null);
    setPanelMode('add');
  };

  const openEdit = (d: Deal) => {
    setEditTarget(d);
    setTitle(d.title);
    setDescription(d.description ?? '');
    setPricePerPerson(d.pricePerPerson);
    setMinPersons(d.minPersons);
    setMaxPersons(d.maxPersons);
    setDiscountPercent(d.discountPercent);
    setValidDays(d.validDays || 5);
    setTimeSlot(d.timeSlot || `${d.validDays || 5} Days Validity`);
    setDealItems(d.items.map(i => ({
      id: i.id,
      menuItemId: i.menuItemId,
      customName: i.customName,
      customUnit: i.customUnit,
      variantId: i.variantId,
      quantity: i.quantity,
      unitPrice: i.unitPrice ?? 0,
    })));
    setPanelMode('edit');
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      title,
      description,
      pricePerPerson: Number(pricePerPerson),
      minPersons: Number(minPersons),
      maxPersons: Number(maxPersons),
      discountPercent: Number(discountPercent),
      validDays: Number(validDays) || 5,
      timeSlot: `${Number(validDays) || 5} Days Validity`,
      items: dealItems.map(i => ({
        menuItemId: i.customName ? null : (i.menuItemId || null),
        customName: i.customName || null,
        customUnit: i.customUnit || null,
        variantId: i.variantId || null,
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
      })),
    };

    if (panelMode === 'add') {
      const res = await fetch('/api/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDeals();
        setPanelMode(null);
        resetForm();
      }
    } else if (panelMode === 'edit' && editTarget) {
      const res = await fetch('/api/deals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: editTarget.dealId, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDeals();
        setPanelMode(null);
        setEditTarget(null);
        resetForm();
      }
    }
    setLoading(false);
  };

  const handleRestartDeal = async (dealId: string, days = 5) => {
    setLoading(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, restart: true, validDays: days }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDeals();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Delete this deal?')) return;
    const res = await fetch(`/api/deals?dealId=${dealId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setDeals(deals.filter(d => d.dealId !== dealId));
  };

  const addMenuItemRow = () => {
    if (menuItems.length === 0) return;
    const mi = menuItems[0];
    setDealItems([
      ...dealItems,
      {
        menuItemId: mi.itemId,
        quantity: 1,
        variantId: mi.variants && mi.variants.length > 0 ? mi.variants[0].variantId : null,
        unitPrice: mi.variants && mi.variants.length > 0 ? mi.variants[0].price : mi.sellingPrice,
      },
    ]);
  };

  const addCustomDishRow = () => {
    setDealItems([
      ...dealItems,
      {
        customName: '',
        customUnit: 'Degh',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const updateDealItem = (idx: number, patch: Partial<DealItem>) => {
    const updated = [...dealItems];
    updated[idx] = { ...updated[idx], ...patch };
    setDealItems(updated);
  };

  const getDealStatus = (deal: Deal) => {
    const start = new Date(deal.startDate || deal.createdAt || Date.now()).getTime();
    const days = deal.validDays || 5;
    const expiry = start + (days * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const diffMs = expiry - now;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const isExpired = diffDays <= 0;

    return {
      isExpired,
      diffDays,
      expiryDate: new Date(expiry),
      validDays: days,
      startDate: new Date(start),
    };
  };

  return (
    <PageContainer
      title="Catering Deals & Packages"
      subtitle="Configure deals with day-based validity (e.g. 5 days from launch) with 1-click deal restart options"
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDeals} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          <PermissionGuard permission="action:deal_create">
            <Button variant="gold" size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add Deal</Button>
          </PermissionGuard>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Deals Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} glass className="space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-24 rounded-md bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between"><div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" /></div>
                  <div className="flex justify-between"><div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" /></div>
                </div>
              </Card>
            ))
          ) : deals.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">No deals found</div>
          ) : deals.map((deal) => {
            const status = getDealStatus(deal);

            return (
              <Card
                key={deal.dealId}
                glass
                className={
                  'space-y-3 transition-all flex flex-col justify-between ' +
                  (status.isExpired ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-slate-200/80 dark:border-slate-800') +
                  (editTarget?.dealId === deal.dealId ? ' ring-2 ring-amber-500' : '')
                }
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{deal.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="gold">{deal.discountPercent}% OFF</Badge>
                      <PermissionGuard permission="action:deal_create">
                        <button onClick={() => openEdit(deal)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(deal.dealId)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {deal.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{deal.description}</p>}

                  {/* Day Validity / Countdown Badge */}
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        Validity ({status.validDays} Days):
                      </span>
                      {status.isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {status.diffDays} Day{status.diffDays === 1 ? '' : 's'} Left
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Expires: {status.expiryDate.toLocaleDateString()}</span>
                      <span>Started: {status.startDate.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl space-y-1 text-xs border border-slate-200/40 dark:border-slate-800/40">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300"><span className="flex items-center gap-1"><Users className="h-3 w-3" />Guests:</span><span>{deal.minPersons} – {deal.maxPersons} Pax</span></div>
                    <div className="flex justify-between text-slate-900 dark:text-slate-200 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 font-bold"><span>Per Person:</span><span className="text-amber-600 dark:text-amber-400">PKR {deal.pricePerPerson.toLocaleString()}</span></div>
                  </div>

                  {/* Items included */}
                  {deal.items && deal.items.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Included Items &amp; Variants</p>
                      {deal.items.map((di, idx) => {
                        const matchedMenu = menuItems.find(m => m.itemId === di.menuItemId) || di.menuItem;
                        const variant = matchedMenu?.variants?.find(v => v.variantId === di.variantId);
                        return (
                          <div key={di.id || idx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <UtensilsCrossed className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="font-medium truncate">
                                {di.customName ? di.customName : (matchedMenu?.name ?? 'Dish')}
                              </span>
                              {di.customName ? (
                                <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1 rounded">Custom</span>
                              ) : variant ? (
                                <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1 rounded truncate">{variant.name}</span>
                              ) : null}
                            </div>
                            <div className="text-slate-400 dark:text-slate-500 shrink-0 text-right text-[11px]">
                              ×{di.quantity} {di.customUnit || matchedMenu?.unit || ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Restart Deal Action */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <Button
                    type="button"
                    variant={status.isExpired ? 'gold' : 'outline'}
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => handleRestartDeal(deal.dealId, deal.validDays || 5)}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Restart Deal ({deal.validDays || 5} Days)
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add/Edit Panel */}
        {panelMode && (
          <div className="w-full lg:w-[460px] shrink-0">
            <Card glass className="space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-600 dark:text-amber-500">{panelMode === 'add' ? 'Add New Deal' : 'Edit Deal'}</h3>
                <button onClick={() => { setPanelMode(null); setEditTarget(null); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                <Input label="Deal Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wedding Platinum Deal" required />
                <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Includes Rice, Gravy, Desserts and Roti" />

                {/* Validity Duration (Days) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deal Validity Duration (Days from Start / Restart)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[3, 5, 7, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValidDays(d)}
                        className={
                          'py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ' +
                          (validDays === d
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500/50')
                        }
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                  <Input
                    label="Custom Validity (Days)"
                    type="number"
                    value={validDays}
                    onChange={e => setValidDays(Math.max(1, Number(e.target.value)))}
                    min={1}
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The deal will remain active for {validDays} days from creation or restart.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input label="Min Guests" type="number" value={minPersons} onChange={e => setMinPersons(Number(e.target.value))} />
                  <Input label="Max Guests" type="number" value={maxPersons} onChange={e => setMaxPersons(Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Price / Person (PKR)" type="number" value={pricePerPerson} onChange={e => setPricePerPerson(Number(e.target.value))} />
                  <Input label="Discount %" type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
                </div>

                {/* Deal Items Section */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Included Dishes &amp; Extras</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={addMenuItemRow} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline font-semibold">
                        <PlusCircle className="h-3.5 w-3.5" />+ Menu Dish
                      </button>
                      <button type="button" onClick={addCustomDishRow} className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline font-semibold">
                        <PlusCircle className="h-3.5 w-3.5" />+ Custom Extra
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dealItems.map((di, idx) => {
                      const isCustom = Boolean(di.customName !== undefined && di.customName !== null);
                      const matchedMenu = menuItems.find(m => m.itemId === di.menuItemId);
                      const hasVariants = Boolean(matchedMenu?.variants && matchedMenu.variants.length > 0);

                      return (
                        <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {isCustom ? 'Custom Item' : 'Menu Dish'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDealItems(dealItems.filter((_, j) => j !== idx))}
                              className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {isCustom ? (
                            <div className="space-y-1.5">
                              <Input
                                label="Custom Dish / Extra Name"
                                value={di.customName || ''}
                                onChange={e => updateDealItem(idx, { customName: e.target.value })}
                                placeholder="e.g. Special Raita, Ice Cream Cups, Salad"
                              />
                              <div className="grid grid-cols-3 gap-1.5">
                                <Input
                                  label="Unit (KG/Degh/Plate)"
                                  value={di.customUnit || ''}
                                  onChange={e => updateDealItem(idx, { customUnit: e.target.value })}
                                  placeholder="Plate"
                                />
                                <Input
                                  label="Quantity"
                                  type="number"
                                  value={di.quantity}
                                  onChange={e => updateDealItem(idx, { quantity: Number(e.target.value) })}
                                />
                                <Input
                                  label="Price (PKR)"
                                  type="number"
                                  value={di.unitPrice || 0}
                                  onChange={e => updateDealItem(idx, { unitPrice: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Select Menu Dish</label>
                                <select
                                  value={di.menuItemId || ''}
                                  onChange={e => {
                                    const selectedM = menuItems.find(m => m.itemId === e.target.value);
                                    updateDealItem(idx, {
                                      menuItemId: e.target.value,
                                      variantId: selectedM?.variants && selectedM.variants.length > 0 ? selectedM.variants[0].variantId : null,
                                      unitPrice: selectedM?.variants && selectedM.variants.length > 0 ? selectedM.variants[0].price : (selectedM?.sellingPrice || 0),
                                    });
                                  }}
                                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs px-2.5 py-1.5"
                                >
                                  {menuItems.map(m => (
                                    <option key={m.itemId} value={m.itemId}>{m.name} ({m.unit})</option>
                                  ))}
                                </select>
                              </div>

                              {hasVariants && (
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Variant / Portion</label>
                                  <select
                                    value={di.variantId || ''}
                                    onChange={e => {
                                      const v = matchedMenu?.variants?.find(vr => vr.variantId === e.target.value);
                                      updateDealItem(idx, {
                                        variantId: e.target.value || null,
                                        unitPrice: v ? v.price : (matchedMenu?.sellingPrice || 0),
                                      });
                                    }}
                                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs px-2.5 py-1.5"
                                  >
                                    <option value="">Base / Standard</option>
                                    {matchedMenu?.variants?.map(vr => (
                                      <option key={vr.variantId} value={vr.variantId}>
                                        {vr.name} ({vr.weightKg}KG) - PKR {vr.price.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-1.5">
                                <Input
                                  label="Quantity"
                                  type="number"
                                  value={di.quantity}
                                  onChange={e => updateDealItem(idx, { quantity: Number(e.target.value) })}
                                />
                                <Input
                                  label="Deal Unit Price (PKR)"
                                  type="number"
                                  value={di.unitPrice || 0}
                                  onChange={e => updateDealItem(idx, { unitPrice: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button variant="gold" className="w-full mt-4" onClick={handleSave} isLoading={loading} leftIcon={<Check className="h-4 w-4" />}>
                  {panelMode === 'add' ? 'Save Deal' : 'Update Deal'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}