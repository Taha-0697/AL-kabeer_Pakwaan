'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Clock, Users, Plus, X, Pencil, Trash2, Check, UtensilsCrossed, PlusCircle } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface MenuItem { itemId: string; name: string; sellingPrice: number; unit: string; }
interface DealItem { id: string; menuItemId: string; menuItem: MenuItem; quantity: number; unitPrice: number; }
interface Deal {
  dealId: string; title: string; description?: string; timeSlot: string;
  minPersons: number; maxPersons: number; pricePerPerson: number;
  discountPercent: number; items: DealItem[];
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Deal | null>(null);

  // Shared form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlot, setTimeSlot] = useState('ANY');
  const [minPersons, setMinPersons] = useState(10);
  const [maxPersons, setMaxPersons] = useState(500);
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [dealItems, setDealItems] = useState<{menuItemId: string; quantity: number; unitPrice: number}[]>([]);

  const fetchDeals = useCallback(() => {
    fetch('/api/deals')
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDeals();
    fetch('/api/menu').then(r => r.json()).then(d => { if (d.success) setMenuItems(d.data); });
  }, [fetchDeals]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setTimeSlot('ANY');
    setMinPersons(10); setMaxPersons(500); setPricePerPerson(0); setDiscountPercent(0);
    setDealItems([]);
  };

  const openAdd = () => { resetForm(); setPanelMode('add'); setEditTarget(null); };
  const openEdit = (deal: Deal) => {
    setTitle(deal.title); setDescription(deal.description ?? '');
    setTimeSlot(deal.timeSlot); setMinPersons(deal.minPersons); setMaxPersons(deal.maxPersons);
    setPricePerPerson(deal.pricePerPerson); setDiscountPercent(deal.discountPercent);
    setDealItems(deal.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: i.unitPrice })));
    setEditTarget(deal); setPanelMode('edit');
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { title, description, timeSlot, minPersons, maxPersons, pricePerPerson, discountPercent, items: dealItems };
    let res: Response;
    if (panelMode === 'add') {
      res = await fetch('/api/deals', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } else {
      res = await fetch('/api/deals', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({dealId: editTarget!.dealId, ...payload}) });
    }
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      if (panelMode === 'add') setDeals([...deals, data.data]);
      else setDeals(deals.map(d => d.dealId === data.data.dealId ? data.data : d));
      setPanelMode(null); setEditTarget(null); resetForm();
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Delete this deal?')) return;
    await fetch('/api/deals?dealId=' + dealId, { method: 'DELETE' });
    setDeals(deals.filter(d => d.dealId !== dealId));
    if (editTarget?.dealId === dealId) { setPanelMode(null); setEditTarget(null); }
  };

  const addDealItem = () => {
    const first = menuItems[0];
    if (!first) return;
    setDealItems([...dealItems, { menuItemId: first.itemId, quantity: 1, unitPrice: first.sellingPrice }]);
  };
  const updateDealItem = (idx: number, field: string, val: any) => {
    const updated = [...dealItems];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'menuItemId') {
      const mi = menuItems.find(m => m.itemId === val);
      if (mi) updated[idx].unitPrice = mi.sellingPrice;
    }
    setDealItems(updated);
  };

  return (
    <PageContainer
      title="Catering Package Deals & Discounts"
      subtitle="Pre-packaged event menus, person tiers, and time slot offers"
      action={
        <PermissionGuard permission="action:deal_create">
          <Button variant="gold" size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add Deal</Button>
        </PermissionGuard>
      }
    >
      <div className="flex gap-6">
        {/* Deals Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {deals.map((deal) => (
            <Card key={deal.dealId} glass className={'space-y-3 ' + (editTarget?.dealId === deal.dealId ? 'border-amber-500/60' : '')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">{deal.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="gold">{deal.discountPercent}% OFF</Badge>
                  <PermissionGuard permission="action:deal_create">
                    <button onClick={() => openEdit(deal)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(deal.dealId)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </PermissionGuard>
                </div>
              </div>
              {deal.description && <p className="text-xs text-slate-400">{deal.description}</p>}
              <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-300"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />Slot:</span><span className="font-bold">{deal.timeSlot}</span></div>
                <div className="flex justify-between text-slate-300"><span className="flex items-center gap-1"><Users className="h-3 w-3" />Guests:</span><span>{deal.minPersons} – {deal.maxPersons} Pax</span></div>
                <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-900 font-bold"><span>Per Person:</span><span className="text-amber-400">PKR {deal.pricePerPerson.toLocaleString()}</span></div>
              </div>
              {/* Items included */}
              {deal.items && deal.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Included Dishes</p>
                  {deal.items.map((di) => (
                    <div key={di.id} className="flex items-center gap-1.5 text-xs text-slate-400 py-0.5">
                      <UtensilsCrossed className="h-3 w-3 text-brand-400 shrink-0" />
                      <span>{di.menuItem?.name ?? 'Unknown'}</span>
                      <span className="ml-auto text-slate-500">×{di.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Add/Edit Panel */}
        {panelMode && (
          <div className="w-[400px] shrink-0">
            <Card glass className="space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-500">{panelMode === 'add' ? 'Add New Deal' : 'Edit Deal'}</h3>
                <button onClick={() => { setPanelMode(null); setEditTarget(null); resetForm(); }}><X className="h-5 w-5 text-slate-500 hover:text-white" /></button>
              </div>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                <Input label="Deal Title" value={title} onChange={e => setTitle(e.target.value)} />
                <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <Input label="Time Slot (LUNCH / DINNER / ANY)" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Min Persons" type="number" value={minPersons} onChange={e => setMinPersons(Number(e.target.value))} />
                  <Input label="Max Persons" type="number" value={maxPersons} onChange={e => setMaxPersons(Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Price / Person" type="number" value={pricePerPerson} onChange={e => setPricePerPerson(Number(e.target.value))} />
                  <Input label="Discount %" type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
                </div>

                {/* Deal Items (menu dishes included) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Included Menu Dishes</span>
                    <button onClick={addDealItem} className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300">
                      <PlusCircle className="h-3.5 w-3.5" />Add Dish
                    </button>
                  </div>
                  {dealItems.map((di, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_auto] gap-1.5 mb-2 items-end">
                      <div>
                        {idx === 0 && <label className="block text-xs text-slate-400 mb-1">Dish</label>}
                        <select
                          value={di.menuItemId}
                          onChange={e => updateDealItem(idx, 'menuItemId', e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-2 focus:outline-none focus:border-amber-500"
                        >
                          {menuItems.map(m => <option key={m.itemId} value={m.itemId}>{m.name}</option>)}
                        </select>
                      </div>
                      <Input label={idx === 0 ? 'Qty' : ''} type="number" value={di.quantity} onChange={e => updateDealItem(idx, 'quantity', Number(e.target.value))} />
                      <button onClick={() => setDealItems(dealItems.filter((_,j) => j !== idx))} className="mb-1 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>

                <Button variant="gold" className="w-full" onClick={handleSave} isLoading={loading} leftIcon={<Check className="h-4 w-4" />}>
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