'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { InventoryTable, InventoryItemDetail } from '@/components/inventory/InventoryTable';
import { TransferModal } from '@/components/inventory/TransferModal';
import { PurchaseModal } from '@/components/inventory/PurchaseModal';
import { Button } from '@/components/ui/Button';
import { Boxes, CookingPot, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';

export default function InventoryPage() {
  const [storeType, setStoreType] = useState<'SUPER_STORE' | 'SUB_STORE'>('SUPER_STORE');
  const [items, setItems] = useState<InventoryItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItemDetail | null>(null);
  const [restockTarget, setRestockTarget] = useState<InventoryItemDetail | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?storeType=${storeType}`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {
      console.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [storeType]);

  const openNewPurchase = () => {
    setRestockTarget(null);
    setIsPurchaseModalOpen(true);
  };

  const openRestock = (item: InventoryItemDetail) => {
    setRestockTarget(item);
    setIsPurchaseModalOpen(true);
  };

  return (
    <PageContainer
      title="Dual Inventory Management"
      subtitle="Super Store (Main Warehouse) & Sub Store (Kitchen Operations)"
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Stock
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={openNewPurchase}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Buy / Add Inventory
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setStoreType('SUPER_STORE')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            storeType === 'SUPER_STORE'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Boxes className="h-4 w-4" />
          <span>Super Store (Main Warehouse)</span>
        </button>
        <button
          onClick={() => setStoreType('SUB_STORE')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            storeType === 'SUB_STORE'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <CookingPot className="h-4 w-4" />
          <span>Sub Store (Kitchen Stock)</span>
        </button>
      </div>

      <InventoryTable
        items={items}
        loading={loading}
        storeType={storeType}
        onTransfer={(item) => setSelectedItem(item)}
        onRestock={openRestock}
      />

      <TransferModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={fetchItems}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        itemToRestock={restockTarget}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setRestockTarget(null);
        }}
        onSuccess={fetchItems}
      />
    </PageContainer>
  );
}
