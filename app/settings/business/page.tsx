'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building, Truck, Percent } from 'lucide-react';

export default function BusinessSettingsPage() {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [defaultTransport, setDefaultTransport] = useState(5000);
  const [baseTransportKm, setBaseTransportKm] = useState(10);
  const [perKmRate, setPerKmRate] = useState(250);
  const [taxName, setTaxName] = useState('GST');
  const [taxPercent, setTaxPercent] = useState(13);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/business/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setName(d.data.name || '');
          setTagline(d.data.tagline || '');
          setPhone(d.data.phone || '');
          setAddress(d.data.address || '');
          setDefaultTransport(d.data.defaultTransport || 5000);
          setBaseTransportKm(d.data.baseTransportKm || 10);
          setPerKmRate(d.data.perKmRate || 250);
          setTaxName(d.data.taxName || 'GST');
          setTaxPercent(d.data.taxPercent || 13);
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    await fetch('/api/business/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, tagline, phone, address,
        defaultTransport, baseTransportKm, perKmRate,
        taxName, taxPercent,
      }),
    });

    setLoading(false);
    setSaved(true);
  };

  return (
    <PageContainer
      title="Business Profile & Rate Formulas"
      subtitle="Catering company profile, transport pricing formulas, and sales tax rules"
    >
      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        {saved && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">Business profile saved successfully!</div>}

        <Card glass className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Building className="h-4 w-4" /> Catering Enterprise Information
          </h3>
          <Input label="Business Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Commercial Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </Card>

        <Card glass className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Truck className="h-4 w-4" /> Transport & Petrol Rate Calculation Formula
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Flat Transport (PKR)" type="number" value={defaultTransport} onChange={(e) => setDefaultTransport(Number(e.target.value))} />
            <Input label="Base Transport Radius (Km)" type="number" value={baseTransportKm} onChange={(e) => setBaseTransportKm(Number(e.target.value))} />
            <Input label="Per Km Excess Rate (PKR)" type="number" value={perKmRate} onChange={(e) => setPerKmRate(Number(e.target.value))} />
          </div>
        </Card>

        <Card glass className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Percent className="h-4 w-4" /> Sales Tax Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tax Name" value={taxName} onChange={(e) => setTaxName(e.target.value)} />
            <Input label="Tax Percentage (%)" type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => window.location.href = '/api/backup/download'}
          >
            Download Database Backup (JSON)
          </Button>
          <Button type="submit" variant="gold" size="lg" isLoading={loading}>
            Save Settings
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
