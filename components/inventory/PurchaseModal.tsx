'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, ShoppingBag, AlertCircle, DollarSign } from 'lucide-react';
import { InventoryItemDetail } from './InventoryTable';

interface PurchaseModalProps {
  isOpen: boolean;
  itemToRestock?: InventoryItemDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  itemToRestock,
  onClose,
  onSuccess,
}) => {
  const [isNewItem, setIsNewItem] = useState(!itemToRestock);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Raw Materials');
  const [unit, setUnit] = useState('KG');
  const [quantity, setQuantity] = useState(10);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [supplier, setSupplier] = useState('Local Market');
  const [notes, setNotes] = useState('Purchased new inventory');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToRestock) {
      setIsNewItem(false);
      setName(itemToRestock.name);
      setSku(itemToRestock.sku);
      setCategory(itemToRestock.category);
      setUnit(itemToRestock.unit);
      setPurchasePrice(itemToRestock.purchasePrice || 0);
      setSupplier(itemToRestock.supplier || 'Main Supplier');
      setQuantity(10);
      setNotes(`Restocked ${itemToRestock.name}`);
    } else {
      setIsNewItem(true);
      setName('');
      setSku('');
      setCategory('Raw Materials');
      setUnit('KG');
      setQuantity(10);
      setPurchasePrice(0);
      setMinStock(5);
      setSupplier('Local Market');
      setNotes('New Inventory Purchase');
    }
  }, [itemToRestock, isOpen]);

  if (!isOpen) return null;

  const totalCost = (Number(quantity) || 0) * (Number(purchasePrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isNewItem) {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            sku: sku || undefined,
            category,
            unit,
            storeType: 'SUPER_STORE',
            currentStock: Number(quantity),
            minStock: Number(minStock),
            purchasePrice: Number(purchasePrice),
            supplier,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || 'Failed to add item');
          setLoading(false);
          return;
        }
      } else if (itemToRestock) {
        const res = await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: itemToRestock.itemId,
            restockQty: Number(quantity),
            purchasePrice: Number(purchasePrice),
            supplier,
            notes,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || 'Failed to restock item');
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <Card glass className="w-full max-w-md shadow-2xl border-amber-500/30 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {isNewItem ? 'Buy / Add New Inventory' : `Restock: ${name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isNewItem ? (
            <>
              <Input
                label="Item Name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Basmati Rice Super Kernel"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Grains / Spices / Oil"
                  required
                />
                <Input
                  label="Unit"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="KG / Litre / Bag"
                  required
                />
              </div>
            </>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-slate-500">Current Stock: {itemToRestock?.currentStock} {unit}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label={isNewItem ? 'Initial Quantity' : 'Restock Quantity'}
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              required
            />
            <Input
              label="Purchase Price / Unit (PKR)"
              type="number"
              value={purchasePrice}
              onChange={e => setPurchasePrice(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="Supplier / Vendor"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
            placeholder="e.g. Al-Madina Grains / Local Mandi"
          />

          {/* Cashbook Notification Alert */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Total Purchase Amount:</span>
              <span>PKR {totalCost.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              This amount will be automatically recorded in the <strong>Cashbook Ledger</strong> as a debited expense (CASH_OUT · INVENTORY).
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" isLoading={loading}>
              Confirm Purchase
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
