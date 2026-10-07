'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { User, Phone, MapPin, Plus, RefreshCw, X, Receipt, CreditCard, Clock } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface Payment {
  paymentId: string;
  amount: number;
  method: string;
  paymentMethod: string;
  receiptNumber: string;
  createdAt: string;
  notes?: string;
}

interface BookingItem {
  bookingItemId: string;
  itemName: string;
  weightKg?: number;
  quantity: number;
  unitPrice: number;
  menuItem: menuItem;
  total: number;
}

interface menuItem {
  name: string;
  category: string;
  itemId: string;
  sellingPrice: number;
}

interface ClientBooking {
  bookingId: string;
  bookingNumber: string;
  eventDate: string;
  grandTotal: number;
  amountPaid?: number;
  totalPaid?: number;
  balance?: number
  balanceDue?: number;
  status: string;
  items: BookingItem[];
  payments: Payment[];
}

interface Client {
  clientId: string;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  bookings?: ClientBooking[];
}

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  console.log(selected)
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) setClients(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openClient = async (c: Client) => {
    setSelected(c); setDetailLoading(true);
    const res = await fetch('/api/clients/' + c.clientId);
    const data = await res.json();
    if (data.success) setSelected(data.data);
    setDetailLoading(false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, cnic, address }),
    });
    const data = await res.json();
    if (data.success) {
      setClients([{ ...data.data, totalOrders: 0, totalSpent: 0 }, ...clients]);
      setIsOpen(false); setName(''); setPhone(''); setCnic(''); setAddress('');
    }
  };

  return (
    <PageContainer
      title="Client Directory & Orders History"
      subtitle="Click any client card to view full order history and payments"
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchClients} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          <PermissionGuard permission="action:client_create">
            <Button variant="gold" size="sm" onClick={() => setIsOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add Client</Button>
          </PermissionGuard>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} glass className="space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
                <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between">
                  <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </Card>
            ))
          ) : clients.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">No clients found</div>
          ) : clients.map((c) => (
            <Card key={c.clientId} glass className={'space-y-3 cursor-pointer transition-all hover:border-amber-500/40 ' + (selected?.clientId === c.clientId ? 'border-amber-500/60' : '')} onClick={() => openClient(c)}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-base">{c.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Phone className="h-3 w-3" /><span>{c.phone}</span></div>
                </div>
              </div>
              {c.address && <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><MapPin className="h-3 w-3" /><span>{c.address}</span></div>}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Orders: <b className="text-slate-800 dark:text-slate-200">{c.totalOrders ?? 0}</b></span>
                <span className="text-slate-500 dark:text-slate-400">Spent: <b className="text-amber-600 dark:text-amber-400">PKR {(c.totalSpent ?? 0).toLocaleString()}</b></span>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <div className="w-full lg:w-[420px] shrink-0">
            <Card glass className="space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{selected.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selected.phone}{selected.cnic ? ' · ' + selected.cnic : ''}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading orders...</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'Orders', val: String(selected.bookings?.length ?? 0), cls: 'text-slate-900 dark:text-slate-200' },
                      { label: 'Total Paid', val: 'PKR ' + (selected.bookings ?? []).reduce((s, b) => s + (b.totalPaid ?? 0), 0).toLocaleString(), cls: 'text-green-600 dark:text-green-400' },
                      { label: 'Balance Due', val: 'PKR ' + (selected.bookings ?? []).reduce((s, b) => s + (b.balance ?? 0), 0).toLocaleString(), cls: 'text-red-600 dark:text-red-400' },
                    ].map(({ label, val, cls }) => (
                      <div key={label} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-2 text-center">
                        <p className="text-slate-500 dark:text-slate-400">{label}</p>
                        <p className={'font-bold ' + cls}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {(selected.bookings ?? []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">No bookings yet</p>
                  ) : (
                    (selected.bookings ?? []).map((b) => (
                      <div key={b.bookingId} className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition-colors" onClick={() => setExpandedBooking(expandedBooking === b.bookingId ? null : b.bookingId)}>
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">#{b.bookingNumber}</p>
                              <p className="text-xs text-slate-500">{new Date(b.eventDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={STATUS_COLOR[b.status] ?? 'neutral'} className="text-xs mb-1">{b.status}</Badge>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">PKR {b.grandTotal.toLocaleString()}</p>
                          </div>
                        </button>
                        {expandedBooking === b.bookingId && (
                          <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-xl">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Order Items</p>
                              {b.items.map((item) => (
                                <div key={item.bookingItemId} className="flex justify-between text-xs py-0.5">
                                  <span className="text-slate-700 dark:text-slate-300">{item.menuItem.name} - {item.weightKg ? `${item.weightKg}kg` : ' '} x {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Payments</p>
                              {b.payments.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-600">No payments recorded</p>
                              ) : b.payments.map((p) => (
                                <div key={p.paymentId} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400"><Receipt className="h-3 w-3" />{p.receiptNumber}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400"><CreditCard className="h-3 w-3" />{p.paymentMethod}</span>
                                    <span className="text-green-600 dark:text-green-400 font-bold">PKR {p.amount.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />Balance Due</span>
                              <span className={b.balance && b.balance > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold'}>PKR {b.balance}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Client">
        <form onSubmit={handleAddClient} className="space-y-4">
          <Input label="Client Full Name" value={name} onChange={(e) => setName(e.target.value)} leftIcon={<User className="h-4 w-4" />} required />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone className="h-4 w-4" />} required />
          <Input label="CNIC (Optional)" value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="35202-1234567-1" />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="DHA Phase 5, Lahore" />
          <div className="flex justify-end gap-3"><Button type="submit" variant="gold">Save Client</Button></div>
        </form>
      </Modal>
    </PageContainer>
  );
}