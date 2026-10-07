'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed, Tag, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VariantForm {
  name: string;
  weightKg: number;
  price: number;
  imageUrl?: string;
  file?: File | null;
}

export const MenuForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Rice');
  const [unit, setUnit] = useState('Degh');
  const [sellingPrice, setSellingPrice] = useState(0);
  
  const [variants, setVariants] = useState<VariantForm[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addVariant = () => {
    setVariants([...variants, { name: '', weightKg: 10, price: 0, file: null }]);
  };

  const updateVariant = (idx: number, field: keyof VariantForm, value: any) => {
    const newVariants = [...variants];
    newVariants[idx] = { ...newVariants[idx], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const uploadFile = async (f: File) => {
    const formData = new FormData();
    formData.append('file', f);
    formData.append('subDir', 'menu');
    const res = await fetch('/api/uploads', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.data.filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return setError('Dish name is required');
    setLoading(true);
    setError('');

    try {
      let mainImageUrl = '';
      if (file) mainImageUrl = await uploadFile(file);

      // Upload variant images
      const processedVariants = await Promise.all(variants.map(async (v) => {
        let vImageUrl = '';
        if (v.file) vImageUrl = await uploadFile(v.file);
        return {
          name: v.name,
          weightKg: v.weightKg,
          price: v.price,
          imageUrl: vImageUrl || undefined
        };
      }));

      const payload = {
        name,
        category,
        unit,
        sellingPrice,
        imageUrl: mainImageUrl,
        variants: processedVariants
      };

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/menu');
      } else {
        setError(data.message || 'Failed to create menu item');
      }
    } catch (err) {
      setError((err as Error).message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
      
      <Card glass className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Dish Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Dish Name" value={name} onChange={(e) => setName(e.target.value)} leftIcon={<UtensilsCrossed className="h-4 w-4" />} required />
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} leftIcon={<Tag className="h-4 w-4" />} required />
          <Input label="Unit (e.g. Degh, Kg)" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          <Input label="Standard Base Price" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} min="0" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Main Picture (Optional)
          </label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100" />
        </div>
      </Card>

      <Card glass className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Variants (e.g. Chicken 10KG, Beef 12KG)</h3>
          <Button type="button" variant="outline" size="sm" onClick={addVariant} leftIcon={<Plus className="h-4 w-4" />}>Add Variant</Button>
        </div>
        
        {variants.length === 0 && <p className="text-xs text-slate-500">No variants added. You can add specific weights and prices here.</p>}
        
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start p-4 rounded-xl border border-slate-700 bg-slate-900/50">
            <div className="md:col-span-1">
              <Input label="Variant Name" placeholder="e.g. Chicken" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} required />
            </div>
            <div className="md:col-span-1">
              <Input label="Weight (KG)" type="number" value={v.weightKg} onChange={(e) => updateVariant(i, 'weightKg', Number(e.target.value))} required />
            </div>
            <div className="md:col-span-1">
              <Input label="Price (PKR)" type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', Number(e.target.value))} required />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e) => updateVariant(i, 'file', e.target.files?.[0] || null)} className="w-full text-xs" />
            </div>
            <div className="md:col-span-1 pt-6 text-right">
              <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        ))}
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/menu')}>Cancel</Button>
        <Button type="submit" variant="gold" size="lg" isLoading={loading}>Save Menu Item</Button>
      </div>
    </form>
  );
};
