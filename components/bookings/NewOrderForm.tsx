'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Calendar, MapPin, Users, Sparkles, ArrowRightLeft, UtensilsCrossed, TrendingDown, TrendingUp } from 'lucide-react';

interface Variant { variantId: string; name: string; weightKg: number; price: number; }
interface MenuItemRaw { itemId: string; name: string; sellingPrice: number; unit: string; category: string; variants: Variant[]; }
interface DealItemRaw { id: string; menuItemId: string; menuItem: MenuItemRaw; quantity: number; unitPrice: number; }
interface DealRaw { dealId: string; title: string; discountPercent: number; pricePerPerson: number; timeSlot: string; minPersons: number; maxPersons: number; items: DealItemRaw[]; }

interface OrderLine {
  isCustom: boolean;
  isDealItem: boolean;          // came from deal
  menuItemId?: string;
  variantId?: string;
  variantName?: string;
  weightKg?: number;
  itemName?: string;
  quantity: number;
  unitPrice: number;            // price charged (deal or modified)
  dealPrice?: number;           // original deal price for comparison
  menuPrice?: number;           // menu catalogue price for comparison
  category: string;
  unit: string;
}

export const NewOrderForm: React.FC = () => {
  const router = useRouter();
  const [clients, setClients] = useState<{ clientId: string; name: string; phone: string }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRaw[]>([]);
  const [deals, setDeals] = useState<DealRaw[]>([]);

  const [selectedClient, setSelectedClient] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('08:00 PM');
  const [venue, setVenue] = useState('');
  const [guestCount, setGuestCount] = useState(100);
  const [selectedDeal, setSelectedDeal] = useState('');
  const [items, setItems] = useState<OrderLine[]>([]);
  const [transportFee, setTransportFee] = useState(5000);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(13);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => d.success && setClients(d.data));
    fetch('/api/menu').then(r => r.json()).then(d => d.success && setMenuItems(d.data));
    fetch('/api/deals').then(r => r.json()).then(d => d.success && setDeals(d.data));
    fetch('/api/business/profile').then(r => r.json()).then(d => {
      if (d.success && d.data) { setTransportFee(d.data.defaultTransport || 5000); setTaxPercent(d.data.taxPercent || 13); }
    });
  }, []);

  const dealObj = useMemo(() => deals.find(d => d.dealId === selectedDeal), [deals, selectedDeal]);

  // ── Deal selection: load deal items into order lines ────────────────────
  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId);
    const deal = deals.find(d => d.dealId === dealId);
    if (!deal || !deal.items) { setItems([]); return; }

    const dealLines: OrderLine[] = deal.items.map(di => {
      const mi = menuItems.find(m => m.itemId === di.menuItemId) || di.menuItem;
      return {
        isCustom: false,
        isDealItem: true,
        menuItemId: di.menuItemId,
        quantity: di.quantity,
        unitPrice: di.unitPrice,           // deal price
        dealPrice: di.unitPrice,            // remember deal price
        menuPrice: mi?.sellingPrice ?? di.unitPrice, // compare
        category: mi?.category ?? 'Deal Item',
        unit: mi?.unit ?? 'Degh',
      };
    });

    // Auto-calculate discount: sum(menuPrice*qty) - sum(dealPrice*qty)
    const menuSum = dealLines.reduce((s, l) => s + (l.menuPrice ?? 0) * l.quantity, 0);
    const dealSum = dealLines.reduce((s, l) => s + l.dealPrice! * l.quantity, 0);
    setDiscountAmount(Math.max(0, Math.round(menuSum - dealSum)));
    setItems(dealLines);
  };

  // ── Item mutation helpers ───────────────────────────────────────────────
  const updateLine = (idx: number, patch: Partial<OrderLine>) => {
    setItems(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const swapMenuItem = (idx: number, menuItemId: string) => {
    const mi = menuItems.find(m => m.itemId === menuItemId);
    if (!mi) return;
    const firstVariant = mi.variants?.[0];
    updateLine(idx, {
      menuItemId,
      unitPrice: firstVariant ? firstVariant.price : mi.sellingPrice,
      menuPrice: mi.sellingPrice,
      variantId: firstVariant?.variantId,
      variantName: firstVariant?.name,
      weightKg: firstVariant?.weightKg,
      category: mi.category,
      unit: mi.unit,
    });
  };

  const addMenuLine = () => {
    if (!menuItems.length) return;
    const mi = menuItems[0];
    setItems(prev => [...prev, {
      isCustom: false, isDealItem: false,
      menuItemId: mi.itemId, quantity: 1,
      unitPrice: mi.sellingPrice, menuPrice: mi.sellingPrice,
      category: mi.category, unit: mi.unit,
    }]);
  };

  const addCustomLine = () => {
    setItems(prev => [...prev, { isCustom: true, isDealItem: false, itemName: '', quantity: 1, unitPrice: 0, category: 'Extra', unit: 'Item' }]);
  };

  const removeLine = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  // ── Totals ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const menuValueTotal = items.reduce((acc, i) => acc + i.quantity * (i.menuPrice ?? i.unitPrice), 0);
  const savings = Math.max(0, menuValueTotal - subtotal);
  const taxAmount = Math.max(0, (subtotal - discountAmount)) * (taxPercent / 100);
  const grandTotal = subtotal - discountAmount + transportFee + taxAmount;

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) { setError('Please select a client'); return; }
    if (items.length === 0) { setError('Add at least one dish'); return; }
    setLoading(true); setError('');

    const isNewClient = selectedClient === 'new';
    const clientObj = clients.find(c => c.clientId === selectedClient);
    if (isNewClient && (!newClientName || !newClientPhone)) { setError('Provide new client name and phone'); setLoading(false); return; }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: isNewClient ? undefined : selectedClient,
          clientName: isNewClient ? newClientName : (clientObj?.name ?? ''),
          clientPhone: isNewClient ? newClientPhone : (clientObj?.phone ?? ''),
          eventDate, eventTime, venue, guestCount,
          dealId: selectedDeal || undefined,
          dealName: dealObj?.title,
          items: items.map(item => ({
            menuItemId: item.isCustom ? undefined : item.menuItemId,
            itemName: item.isCustom ? item.itemName : undefined,
            category: item.category ?? 'Extras',
            unit: item.unit ?? 'Item',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: 0,
            variantName: item.variantName,
            weightKg: item.weightKg,
          })),
          transportFee, discountAmount, taxPercent,
        }),
      });
      const data = await res.json();
      if (data.success) { router.push('/bookings'); }
      else { setError(data.message || 'Failed to create order'); setLoading(false); }
    } catch { setError('Connection error'); setLoading(false); }
  };

  const priceDelta = (line: OrderLine) => {
    if (!line.menuPrice) return null;
    const diff = line.unitPrice - line.menuPrice;
    return diff;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-xs text-red-500 font-semibold bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      {/* ── Client & Event ── */}
      <Card glass className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Client & Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Select Client</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100" required>
              <option value="">-- Choose Client --</option>
              <option value="new">+ Create New Client</option>
              {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          {selectedClient === 'new' && (
            <>
              <Input label="New Client Name" value={newClientName} onChange={e => setNewClientName(e.target.value)} required />
              <Input label="New Client Phone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} required />
            </>
          )}
          <Input label="Venue Location" value={venue} onChange={e => setVenue(e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} required />
          <Input label="Event Date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} leftIcon={<Calendar className="h-4 w-4" />} required />
          <Input label="Guest Count" type="number" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} leftIcon={<Users className="h-4 w-4" />} required />
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Select Deal (Optional)</label>
            <select value={selectedDeal} onChange={e => handleDealSelect(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100">
              <option value="">-- No Deal --</option>
              {deals.map(d => <option key={d.dealId} value={d.dealId}>{d.title} ({d.discountPercent}% OFF · PKR {d.pricePerPerson}/pax)</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Deal preview banner ── */}
      {dealObj && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{dealObj.title}</span>
              <Badge variant="gold">{dealObj.discountPercent}% OFF</Badge>
            </div>
            <span className="text-xs text-slate-400">{dealObj.minPersons}–{dealObj.maxPersons} Pax · PKR {dealObj.pricePerPerson.toLocaleString()}/pax</span>
          </div>
          {savings > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Deal saves PKR {savings.toLocaleString()} vs menu catalogue prices</span>
            </div>
          )}
          <p className="text-xs text-slate-500">Dishes pre-loaded from deal. You can adjust qty, swap dishes, or add extras below.</p>
        </div>
      )}

      {/* ── Order Items ── */}
      <Card glass className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Order Dishes & Extras</h3>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addMenuLine} leftIcon={<Plus className="h-4 w-4" />}>Add Menu Dish</Button>
            <Button type="button" variant="outline" size="sm" onClick={addCustomLine} leftIcon={<Sparkles className="h-4 w-4" />}>Add Custom Extra</Button>
          </div>
        </div>

        {/* Column header */}
        {items.length > 0 && (
          <div className="hidden md:grid grid-cols-[24px_1fr_80px_110px_110px_100px_32px] gap-2 text-xs font-semibold text-slate-500 uppercase px-3">
            <span></span>
            <span>Dish / Item</span>
            <span>Qty</span>
            <span>Deal Price</span>
            <span>Menu Price</span>
            <span>Line Total</span>
            <span></span>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-sm">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-20" />
            Select a deal above or add dishes manually
          </div>
        )}

        {items.map((item, idx) => {
          const mi = menuItems.find(m => m.itemId === item.menuItemId);
          const delta = priceDelta(item);
          return (
            <div key={idx} className={'rounded-xl border p-3 space-y-2 ' + (item.isDealItem ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800 bg-slate-900/60')}>
              <div className="flex flex-wrap md:flex-nowrap items-start gap-2">
                {/* Badge */}
                <div className="mt-1.5 shrink-0">
                  {item.isDealItem
                    ? <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md">DEAL</span>
                    : <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-md">EXTRA</span>}
                </div>

                {/* Dish selector or custom input */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {item.isCustom ? (
                    <input
                      type="text" value={item.itemName || ''} required
                      onChange={e => updateLine(idx, { itemName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                      placeholder="Custom dish / extra name"
                    />
                  ) : (
                    <select
                      value={item.menuItemId}
                      onChange={e => swapMenuItem(idx, e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                    >
                      {menuItems.map(m => <option key={m.itemId} value={m.itemId}>{m.name} ({m.unit})</option>)}
                    </select>
                  )}

                  {/* Variant selector */}
                  {!item.isCustom && mi?.variants && mi.variants.length > 0 && (
                    <select
                      value={item.variantId || ''}
                      onChange={e => {
                        const v = mi.variants.find(v => v.variantId === e.target.value);
                        if (v) updateLine(idx, { variantId: v.variantId, variantName: v.name, weightKg: v.weightKg, unitPrice: v.price });
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                    >
                      <option value="">-- Select Variant (Size/KG) --</option>
                      {mi.variants.map(v => <option key={v.variantId} value={v.variantId}>{v.name} · {v.weightKg}KG · PKR {v.price.toLocaleString()}</option>)}
                    </select>
                  )}
                </div>

                {/* Qty */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">Qty</span>
                  <input
                    type="number" value={item.quantity} min="0.1" step="0.1" required
                    onChange={e => updateLine(idx, { quantity: Number(e.target.value) })}
                    className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                {/* Deal Price (editable) */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">Price (PKR)</span>
                  <input
                    type="number" value={item.unitPrice} min="0"
                    onChange={e => updateLine(idx, { unitPrice: Number(e.target.value) })}
                    className="w-28 rounded-xl border border-amber-500/30 bg-slate-950 px-3 py-2 text-xs text-amber-300 font-semibold"
                  />
                </div>

                {/* Menu Catalogue Price (read-only comparison) */}
                {item.menuPrice !== undefined && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500">Menu Price</span>
                    <div className="w-28 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-500 flex items-center gap-1">
                      {delta !== null && delta !== 0 && (
                        delta < 0
                          ? <TrendingDown className="h-3 w-3 text-green-400 shrink-0" />
                          : <TrendingUp className="h-3 w-3 text-red-400 shrink-0" />
                      )}
                      PKR {item.menuPrice.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Line total */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">Total</span>
                  <div className="w-28 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs font-bold text-white">
                    PKR {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                </div>

                {/* Delete */}
                <button type="button" onClick={() => removeLine(idx)} className="mt-5 p-2 text-red-400 hover:text-red-300 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Delta hint */}
              {delta !== null && delta !== 0 && (
                <div className={'text-[10px] flex items-center gap-1 ' + (delta < 0 ? 'text-green-500' : 'text-red-400')}>
                  {delta < 0
                    ? <><TrendingDown className="h-3 w-3" /> PKR {Math.abs(delta).toLocaleString()} cheaper than menu catalogue</>
                    : <><TrendingUp className="h-3 w-3" /> PKR {Math.abs(delta).toLocaleString()} above menu catalogue</>}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── Summary ── */}
      <Card glass className="space-y-3 text-xs font-semibold">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
          <Input label="Transport Fee" type="number" value={transportFee} onChange={e => setTransportFee(Number(e.target.value))} />
          <Input label="Discount Amount" type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} />
        </div>
        <div className="space-y-2 text-xs">
          {savings > 0 && (
            <div className="flex justify-between text-green-500">
              <span className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" />Deal Savings (vs catalogue):</span>
              <span>– PKR {savings.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400"><span>Subtotal:</span><span>PKR {subtotal.toLocaleString()}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount:</span><span>– PKR {discountAmount.toLocaleString()}</span></div>}
          <div className="flex justify-between text-slate-400"><span>Transport Fee:</span><span>PKR {transportFee.toLocaleString()}</span></div>
          <div className="flex justify-between text-slate-400"><span>Tax ({taxPercent}%):</span><span>PKR {Math.round(taxAmount).toLocaleString()}</span></div>
          <div className="flex justify-between text-base font-extrabold text-amber-400 pt-2 border-t border-slate-800">
            <span>Grand Total:</span><span>PKR {Math.round(grandTotal).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="gold" size="lg" isLoading={loading}>Save & Confirm Booking</Button>
      </div>
    </form>
  );
};