'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { UtensilsCrossed, Plus, RefreshCw, Pencil, Trash2, X, Check, PlusCircle } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface Variant { variantId?: string; name: string; weightKg: number; price: number; }
interface MenuItem {
  itemId: string; name: string; category: string; unit: string;
  sellingPrice: number; chickenPrice: number; beefPrice: number; muttonPrice: number;
  description?: string; variants: Variant[];
}

export default function MenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const startEdit = (item: MenuItem) => {
    setEditing(JSON.parse(JSON.stringify(item))); // deep clone
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: editing.itemId,
        name: editing.name, category: editing.category, unit: editing.unit,
        sellingPrice: editing.sellingPrice, chickenPrice: editing.chickenPrice,
        beefPrice: editing.beefPrice, muttonPrice: editing.muttonPrice,
        description: editing.description,
        variants: editing.variants.map(({ name, weightKg, price }) => ({ name, weightKg, price })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setItems(items.map(i => i.itemId === data.data.itemId ? data.data : i));
      setEditing(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this dish?')) return;
    await fetch('/api/menu?itemId=' + itemId, { method: 'DELETE' });
    setItems(items.filter(i => i.itemId !== itemId));
    if (editing?.itemId === itemId) setEditing(null);
  };

  const updateVariant = (idx: number, field: keyof Variant, val: any) => {
    if (!editing) return;
    const v = [...editing.variants];
    v[idx] = { ...v[idx], [field]: val };
    setEditing({ ...editing, variants: v });
  };

  return (
    <PageContainer
      title="Menu Dishes & Recipe Formulations"
      subtitle="Catering dish options, multi-meat variant pricing, and Degh yields"
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchMenu} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          <PermissionGuard permission="action:menu_create">
            <Button variant="gold" size="sm" onClick={() => router.push('/menu/new')} leftIcon={<Plus className="h-4 w-4" />}>Add Dish</Button>
          </PermissionGuard>
        </div>
      }
    >
      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {items.map((item) => (
            <Card key={item.itemId} glass className={'space-y-3 transition-all ' + (editing?.itemId === item.itemId ? 'border-amber-500/60' : '')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-brand-400" />
                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="gold">{item.category}</Badge>
                  <PermissionGuard permission="action:menu_create">
                    <button onClick={() => startEdit(item)} className="ml-1 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteItem(item.itemId)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </PermissionGuard>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-300"><span>Price:</span><span className="font-bold text-amber-400">PKR {item.sellingPrice.toLocaleString()} / {item.unit}</span></div>
                {item.variants && item.variants.length > 0 ? (
                  item.variants.map((v, i) => (
                    <div key={v.variantId ?? i} className="flex justify-between text-slate-400">
                      <span>{v.name} ({v.weightKg}KG)</span>
                      <span className="font-bold text-brand-400">PKR {v.price.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <>
                    {item.chickenPrice > 0 && <div className="flex justify-between text-slate-400"><span>Chicken:</span><span>PKR {item.chickenPrice.toLocaleString()}</span></div>}
                    {item.beefPrice > 0 && <div className="flex justify-between text-slate-400"><span>Beef:</span><span>PKR {item.beefPrice.toLocaleString()}</span></div>}
                    {item.muttonPrice > 0 && <div className="flex justify-between text-slate-400"><span>Mutton:</span><span>PKR {item.muttonPrice.toLocaleString()}</span></div>}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Edit Panel */}
        {editing && (
          <div className="w-[380px] shrink-0">
            <Card glass className="space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-500">Edit Dish</h3>
                <button onClick={() => setEditing(null)}><X className="h-5 w-5 text-slate-500 hover:text-white" /></button>
              </div>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                <Input label="Dish Name" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Category" value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} />
                  <Input label="Unit" value={editing.unit} onChange={e => setEditing({...editing, unit: e.target.value})} />
                </div>
                <Input label="Selling Price (PKR)" type="number" value={editing.sellingPrice} onChange={e => setEditing({...editing, sellingPrice: Number(e.target.value)})} />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Chicken" type="number" value={editing.chickenPrice} onChange={e => setEditing({...editing, chickenPrice: Number(e.target.value)})} />
                  <Input label="Beef" type="number" value={editing.beefPrice} onChange={e => setEditing({...editing, beefPrice: Number(e.target.value)})} />
                  <Input label="Mutton" type="number" value={editing.muttonPrice} onChange={e => setEditing({...editing, muttonPrice: Number(e.target.value)})} />
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Degh Variants</span>
                    <button onClick={() => setEditing({...editing, variants: [...editing.variants, {name:'', weightKg:10, price:0}]})} className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300">
                      <PlusCircle className="h-3.5 w-3.5" />Add Variant
                    </button>
                  </div>
                  {editing.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_80px_auto] gap-1.5 mb-2 items-end">
                      <Input label={i === 0 ? 'Name' : ''} value={v.name} onChange={e => updateVariant(i,'name',e.target.value)} />
                      <Input label={i === 0 ? 'KG' : ''} type="number" value={v.weightKg} onChange={e => updateVariant(i,'weightKg',Number(e.target.value))} />
                      <Input label={i === 0 ? 'Price' : ''} type="number" value={v.price} onChange={e => updateVariant(i,'price',Number(e.target.value))} />
                      <button onClick={() => setEditing({...editing, variants: editing.variants.filter((_,j)=>j!==i)})} className="mb-1 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>

                <Button variant="gold" className="w-full" onClick={saveEdit} isLoading={saving} leftIcon={<Check className="h-4 w-4" />}>Save Changes</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}