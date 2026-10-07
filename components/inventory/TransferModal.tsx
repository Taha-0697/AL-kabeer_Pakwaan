'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InventoryItemDetail } from './InventoryTable';

export const TransferModal: React.FC<{
  item: InventoryItemDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.itemId, quantity, notes }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Transfer failed');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!item} onClose={onClose} title={`Transfer to Kitchen Sub-Store - ${item.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        <div className="p-3 rounded-xl bg-slate-800 text-xs space-y-1">
          <p className="text-slate-400">Item: <span className="text-slate-100 font-bold">{item.name}</span></p>
          <p className="text-slate-400">Available Super Store Stock: <span className="text-brand-400 font-bold">{item.currentStock} {item.unit}</span></p>
        </div>

        <Input
          label={`Transfer Quantity (${item.unit})`}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          max={item.currentStock}
          min={1}
          required
        />

        <Input
          label="Transfer Notes / Reason"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Shifted 20kg rice for weekend wedding deghs..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" isLoading={loading}>
            Execute Transfer & Auto-Deduct
          </Button>
        </div>
      </form>
    </Modal>
  );
};
