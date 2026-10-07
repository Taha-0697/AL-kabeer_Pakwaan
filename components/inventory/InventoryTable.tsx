'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowRightLeft, ShoppingCart } from 'lucide-react';

export interface InventoryItemDetail {
  itemId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  storeType: string;
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  supplier?: string;
}

export const InventoryTable: React.FC<{
  items: InventoryItemDetail[];
  loading?: boolean;
  storeType: 'SUPER_STORE' | 'SUB_STORE';
  onTransfer?: (item: InventoryItemDetail) => void;
  onRestock?: (item: InventoryItemDetail) => void;
}> = ({ items, loading, storeType, onTransfer, onRestock }) => {
  return (
    <Card glass className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">SKU / Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Min Stock</th>
              <th className="p-4">Price / Unit</th>
              <th className="p-4">Status</th>
              {storeType === 'SUPER_STORE' && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="p-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                  {storeType === 'SUPER_STORE' && <td className="p-4"><div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 ml-auto" /></td>}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  No inventory items recorded for this store.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.minStock > 0 && item.currentStock <= item.minStock;

                return (
                  <tr key={item.itemId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{item.sku || item.itemId}</p>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{item.category}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{item.minStock} {item.unit}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-200">PKR {item.purchasePrice}</td>
                    <td className="p-4">
                      {isLow ? (
                        <Badge variant="danger" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>LOW STOCK</span>
                        </Badge>
                      ) : (
                        <Badge variant="success">IN STOCK</Badge>
                      )}
                    </td>
                    {storeType === 'SUPER_STORE' && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestock && onRestock(item)}
                            leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
                          >
                            Restock (Buy)
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => onTransfer && onTransfer(item)}
                            leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                          >
                            Transfer
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
