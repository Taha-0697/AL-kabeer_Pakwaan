'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Plus, Trash2, Calendar, MapPin, Users, Sparkles,
  ArrowRightLeft, UtensilsCrossed, TrendingDown, TrendingUp, Percent,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface Variant { variantId: string; name: string; weightKg: number; price: number; }
interface MenuItemRaw { itemId: string; name: string; sellingPrice: number; unit: string; category: string; variants: Variant[]; }
interface DealItemRaw {
  id: string;
  menuItemId?: string | null;
  customName?: string | null;
  customUnit?: string | null;
  variantId?: string | null;
  menuItem?: MenuItemRaw | null;
  quantity: number;
  unitPrice: number;
}
interface DealRaw {
  dealId: string;
  title: string;
  discountPercent: number;
  pricePerPerson: number;
  timeSlot: string;
  validDays?: number;
  minPersons: number;
  maxPersons: number;
  items: DealItemRaw[];
}

interface OrderLine {
  isCustom: boolean;
  isDealItem: boolean;          // came from deal
  menuItemId?: string;
  variantId?: string;
  variantName?: string;
  weightKg?: number;
  itemName?: string;
  quantity: number;
  menuPrice: number;            // base catalogue rate
  discountPercent: number;      // per-item discount percent from deal or customized
  unitPrice: number;            // discounted final price charged per unit
  dealPrice?: number;           // original deal price for comparison
  category: string;
  unit: string;
}

export const NewOrderForm: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
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

  // ── Deal selection: load deal items and calculate item discounts ────────────────────
  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId);
    const deal = deals.find(d => d.dealId === dealId);
    if (!deal || !deal.items) {
      // Clear or reset deal flags on existing items
      setItems(prev => prev.map(l => ({
        ...l,
        isDealItem: false,
        discountPercent: 0,
        unitPrice: l.menuPrice,
      })));
      return;
    }

    const dDiscount = deal.discountPercent || 0;

    const dealLines: OrderLine[] = deal.items.map(di => {
      const mi = menuItems.find(m => m.itemId === di.menuItemId) || di.menuItem;
      const isCustom = !di.menuItemId || Boolean(di.customName);
      const variant = mi?.variants?.find(v => v.variantId === di.variantId);
      const basePrice = (variant ? variant.price : mi?.sellingPrice) ?? di.unitPrice ?? 0;

      // Determine unit price and discount
      let itemDisc = dDiscount;
      let chargedPrice = basePrice;

      if (di.unitPrice && di.unitPrice > 0) {
        chargedPrice = di.unitPrice;
        itemDisc = basePrice > 0 ? Math.round(((basePrice - chargedPrice) / basePrice) * 100) : dDiscount;
      } else if (dDiscount > 0) {
        chargedPrice = Math.round(basePrice * (1 - dDiscount / 100));
        itemDisc = dDiscount;
      }

      return {
        isCustom,
        isDealItem: true,
        menuItemId: di.menuItemId || undefined,
        variantId: di.variantId || undefined,
        variantName: variant?.name,
        weightKg: variant?.weightKg,
        itemName: di.customName || mi?.name || 'Deal Item',
        quantity: di.quantity,
        menuPrice: basePrice,
        discountPercent: Math.max(0, itemDisc),
        unitPrice: chargedPrice,
        dealPrice: chargedPrice,
        category: mi?.category ?? (isCustom ? 'Extra' : 'Deal Item'),
        unit: di.customUnit || mi?.unit || 'Degh',
      };
    });

    setItems(dealLines);
  };

  // ── Item mutation helpers ───────────────────────────────────────────────
  const updateLine = (idx: number, patch: Partial<OrderLine>) => {
    setItems(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, ...patch };

      // If user adjusted discount %
      if (patch.discountPercent !== undefined && patch.unitPrice === undefined) {
        const disc = Number(patch.discountPercent) || 0;
        updated.unitPrice = Math.max(0, Math.round(updated.menuPrice * (1 - disc / 100)));
      }
      // If user adjusted unit price directly
      else if (patch.unitPrice !== undefined && patch.discountPercent === undefined) {
        const price = Number(patch.unitPrice) || 0;
        if (updated.menuPrice > 0) {
          updated.discountPercent = Math.max(0, Math.round(((updated.menuPrice - price) / updated.menuPrice) * 100));
        }
      }

      return updated;
    }));
  };

  const swapMenuItem = (idx: number, menuItemId: string) => {
    const mi = menuItems.find(m => m.itemId === menuItemId);
    if (!mi) return;
    const firstVariant = mi.variants?.[0];
    const basePrice = firstVariant ? firstVariant.price : mi.sellingPrice;
    const disc = dealObj?.discountPercent || 0;
    const discountedPrice = disc > 0 ? Math.round(basePrice * (1 - disc / 100)) : basePrice;

    updateLine(idx, {
      menuItemId,
      menuPrice: basePrice,
      discountPercent: disc,
      unitPrice: discountedPrice,
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
    const firstVariant = mi.variants?.[0];
    const basePrice = firstVariant ? firstVariant.price : mi.sellingPrice;
    const disc = dealObj?.discountPercent || 0;
    const discountedPrice = disc > 0 ? Math.round(basePrice * (1 - disc / 100)) : basePrice;

    setItems(prev => [...prev, {
      isCustom: false,
      isDealItem: Boolean(selectedDeal),
      menuItemId: mi.itemId,
      variantId: firstVariant?.variantId,
      variantName: firstVariant?.name,
      weightKg: firstVariant?.weightKg,
      quantity: 1,
      menuPrice: basePrice,
      discountPercent: disc,
      unitPrice: discountedPrice,
      dealPrice: discountedPrice,
      category: mi.category,
      unit: mi.unit,
    }]);
  };

  const addCustomLine = () => {
    setItems(prev => [...prev, {
      isCustom: true,
      isDealItem: false,
      itemName: '',
      quantity: 1,
      menuPrice: 0,
      discountPercent: 0,
      unitPrice: 0,
      category: 'Extra',
      unit: 'Plate',
    }]);
  };

  const removeLine = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  // ── Totals ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const menuValueTotal = items.reduce((acc, i) => acc + i.quantity * (i.menuPrice > 0 ? i.menuPrice : i.unitPrice), 0);
  const totalItemSavings = Math.max(0, menuValueTotal - subtotal);
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
          dealDiscount: dealObj?.discountPercent || 0,
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
          subtotal,
          transportFee,
          discountAmount,
          taxPercent,
          grandTotal,
        }),
      });
      const data = await res.json();
      if (data.success) { router.push('/bookings'); }
      else { setError(data.message || 'Failed to create order'); setLoading(false); }
    } catch { setError('Connection error'); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-xs text-red-500 font-semibold bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      {/* ── Client & Event Info ── */}
      <Card glass className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">{t('eventAndClientDetails')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">{t('client')}</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100" required>
              <option value="">{t('selectClient')}</option>
              <option value="new">+ {t('newClient')}</option>
              {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          {selectedClient === 'new' && (
            <>
              <Input label={t('newClientName')} value={newClientName} onChange={e => setNewClientName(e.target.value)} required />
              <Input label={t('newClientPhone')} value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} required />
            </>
          )}
          <Input label={t('venue')} value={venue} onChange={e => setVenue(e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} required />
          <Input label={t('eventDate')} type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} leftIcon={<Calendar className="h-4 w-4" />} required />
          <Input label={t('guestCount')} type="number" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} leftIcon={<Users className="h-4 w-4" />} required />
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">{t('selectDeal')}</label>
            <select value={selectedDeal} onChange={e => handleDealSelect(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100">
              <option value="">{t('noDeal')}</option>
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
              <Badge variant="gold">{dealObj.discountPercent}% Deal Discount Applied</Badge>
            </div>
            <span className="text-xs text-slate-400">{dealObj.minPersons}–{dealObj.maxPersons} {t('guests')} · PKR {dealObj.pricePerPerson.toLocaleString()}/pax</span>
          </div>
          {totalItemSavings > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Deal discount saves PKR {totalItemSavings.toLocaleString()} across all items vs menu prices</span>
            </div>
          )}
        </div>
      )}

      {/* ── Order Items ── */}
      <Card glass className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">{t('orderDishesAndExtras')}</h3>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addMenuLine} leftIcon={<Plus className="h-4 w-4" />}>{t('addMenuDish')}</Button>
            <Button type="button" variant="outline" size="sm" onClick={addCustomLine} leftIcon={<Sparkles className="h-4 w-4" />}>{t('addCustomExtra')}</Button>
          </div>
        </div>

        {/* Column header */}
        {items.length > 0 && (
          <div className="hidden md:grid grid-cols-[24px_1fr_75px_100px_90px_110px_100px_32px] gap-2 text-[11px] font-semibold text-slate-500 uppercase px-3">
            <span></span>
            <span>{t('dishOrItem')}</span>
            <span>{t('qty')}</span>
            <span>Menu Rate</span>
            <span>Discount %</span>
            <span>Charged Rate</span>
            <span>{t('lineTotal')}</span>
            <span></span>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-20" />
            {t('noData')}
          </div>
        )}

        {items.map((item, idx) => {
          const mi = menuItems.find(m => m.itemId === item.menuItemId);
          const itemSavings = (item.menuPrice - item.unitPrice) * item.quantity;

          return (
            <div key={idx} className={'rounded-xl border p-3 space-y-2 transition-colors ' + (item.isDealItem ? 'border-amber-500/25 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm')}>
              <div className="flex flex-wrap md:flex-nowrap items-start gap-2">
                {/* Badge */}
                <div className="mt-1.5 shrink-0">
                  {item.isDealItem
                    ? <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">DEAL</span>
                    : <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md">EXTRA</span>}
                </div>

                {/* Dish selector or custom input */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {item.isCustom ? (
                    <input
                      type="text" value={item.itemName || ''} required
                      onChange={e => updateLine(idx, { itemName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder={t('customDishName')}
                    />
                  ) : (
                    <select
                      value={item.menuItemId}
                      onChange={e => swapMenuItem(idx, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
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
                        if (v) {
                          const basePrice = v.price;
                          const disc = item.discountPercent || (dealObj?.discountPercent || 0);
                          const discPrice = disc > 0 ? Math.round(basePrice * (1 - disc / 100)) : basePrice;
                          updateLine(idx, {
                            variantId: v.variantId,
                            variantName: v.name,
                            weightKg: v.weightKg,
                            menuPrice: basePrice,
                            unitPrice: discPrice,
                          });
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">{t('selectVariant')}</option>
                      {mi.variants.map(v => <option key={v.variantId} value={v.variantId}>{v.name} · {v.weightKg}KG · PKR {v.price.toLocaleString()}</option>)}
                    </select>
                  )}
                </div>

                {/* Qty */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">{t('qty')}</span>
                  <input
                    type="number" value={item.quantity} min="0.1" step="0.1" required
                    onChange={e => updateLine(idx, { quantity: Number(e.target.value) })}
                    className="w-18 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Menu Catalogue Base Price */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">Menu Rate</span>
                  <input
                    type="number"
                    value={item.menuPrice}
                    min="0"
                    onChange={e => {
                      const newMenu = Number(e.target.value);
                      const disc = item.discountPercent || 0;
                      updateLine(idx, {
                        menuPrice: newMenu,
                        unitPrice: Math.round(newMenu * (1 - disc / 100)),
                      });
                    }}
                    className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-2.5 py-2 text-xs text-slate-600 dark:text-slate-400"
                  />
                </div>

                {/* Item Discount % (from Deal or editable) */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <Percent className="h-2.5 w-2.5 text-amber-500" /> Discount %
                  </span>
                  <input
                    type="number"
                    value={item.discountPercent}
                    min="0"
                    max="100"
                    onChange={e => updateLine(idx, { discountPercent: Number(e.target.value) })}
                    className="w-20 rounded-xl border border-amber-500/30 bg-amber-50/60 dark:bg-slate-950 px-2 py-2 text-xs text-amber-700 dark:text-amber-300 font-bold"
                  />
                </div>

                {/* Charged Rate (editable) */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">Charged Rate</span>
                  <input
                    type="number" value={item.unitPrice} min="0"
                    onChange={e => updateLine(idx, { unitPrice: Number(e.target.value) })}
                    className="w-26 rounded-xl border border-amber-500/40 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 font-bold"
                  />
                </div>

                {/* Line total */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500">{t('lineTotal')}</span>
                  <div className="w-26 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                    PKR {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                </div>

                {/* Delete */}
                <button type="button" onClick={() => removeLine(idx)} className="mt-5 p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Discount Savings Banner per line */}
              {itemSavings > 0 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <TrendingDown className="h-3 w-3" />
                  {item.discountPercent}% Deal Discount applied (Saved PKR {itemSavings.toLocaleString()})
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── Summary ── */}
      <Card glass className="space-y-3 text-xs font-semibold">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Input label={t('transportFee')} type="number" value={transportFee} onChange={e => setTransportFee(Number(e.target.value))} />
          <Input label={t('discountAmount')} type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} placeholder="Additional general discount" />
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Catalogue Subtotal (Before Discount):</span>
            <span>PKR {menuValueTotal.toLocaleString()}</span>
          </div>
          {totalItemSavings > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" />Deal &amp; Item Discounts:</span>
              <span>– PKR {totalItemSavings.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <span>Net Dishes Subtotal:</span>
            <span>PKR {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Additional Discount:</span>
              <span>– PKR {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t('transportFee')}:</span><span>PKR {transportFee.toLocaleString()}</span></div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t('tax')} ({taxPercent}%):</span><span>PKR {Math.round(taxAmount).toLocaleString()}</span></div>
          <div className="flex justify-between text-base font-extrabold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>{t('grandTotal')}:</span><span>PKR {Math.round(grandTotal).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="gold" size="lg" isLoading={loading}>{t('saveAndConfirmBooking')}</Button>
      </div>
    </form>
  );
};