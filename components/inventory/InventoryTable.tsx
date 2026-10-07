'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowRightLeft } from 'lucide-react';

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
  storeType: 'SUPER_STORE' | 'SUB_STORE';
  onTransfer?: (item: InventoryItemDetail) => void;
}> = ({ items, storeType, onTransfer }) => {
  return (
    <Card glass className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">SKU / Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Min Stock</th>
              <th className="p-4">Price / Unit</th>
              <th className="p-4">Status</th>
              {storeType === 'SUPER_STORE' && <th className="p-4 text-right">Transfer to Kitchen</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No inventory items recorded for this store.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.minStock > 0 && item.currentStock <= item.minStock;

                return (
                  <tr key={item.itemId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-slate-100">{item.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{item.sku || item.itemId}</p>
                    </td>
                    <td className="p-4 text-slate-300">{item.category}</td>
                    <td className="p-4 font-bold text-white">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-4 text-slate-400">{item.minStock} {item.unit}</td>
                    <td className="p-4 text-slate-200">PKR {item.purchasePrice}</td>
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
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => onTransfer && onTransfer(item)}
                          leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                        >
                          Transfer
                        </Button>
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
