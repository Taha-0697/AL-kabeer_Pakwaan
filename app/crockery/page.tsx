'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CookingPot } from 'lucide-react';

interface CrockeryItem {
  crockeryId: string;
  name: string;
  category: string;
  totalStock: number;
  issuedQuantity: number;
  availableQuantity: number;
  replacementCost: number;
}

export default function CrockeryPage() {
  const [items, setItems] = useState<CrockeryItem[]>([]);

  useEffect(() => {
    fetch('/api/crockery')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      })
      .catch(() => {});
  }, []);

  return (
    <PageContainer
      title="Crockery & Utensil Stock Control"
      subtitle="Track Daighs, covers, serving trays, issued quantities per event, and recovery statuses"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((c) => (
          <Card key={c.crockeryId} glass className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CookingPot className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-white text-sm">{c.name}</h3>
              </div>
              <Badge variant="gold">{c.category}</Badge>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-300"><span>Total Stock:</span><span className="font-bold text-white">{c.totalStock} units</span></div>
              <div className="flex justify-between text-slate-400"><span>Issued to Events:</span><span className="text-amber-400 font-bold">{c.issuedQuantity} units</span></div>
              <div className="flex justify-between text-slate-400"><span>Available in Store:</span><span className="text-emerald-400 font-bold">{c.availableQuantity} units</span></div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-900"><span>Replacement Cost:</span><span>PKR {c.replacementCost.toLocaleString()}</span></div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
