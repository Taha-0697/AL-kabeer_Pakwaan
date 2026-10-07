'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserItem } from './UserManagementTable';

export const UserModal: React.FC<{
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('ADMIN');
      setPassword('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = user ? `/api/users/${user.userId}` : '/api/users';
    const method = user ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Operation failed');
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
    <Modal isOpen={isOpen} onClose={onClose} title={user ? `Edit User - ${user.name}` : 'Create New User Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} required />
        <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-slate-300">Assign Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Full Unrestricted Access)</option>
            <option value="ADMIN">ADMIN (All Business Features)</option>
            <option value="MANAGER">MANAGER (Bookings, Menu, Inventory & Cashbook)</option>
            <option value="BOOKING_STAFF">BOOKING_STAFF (Bookings & Clients Only)</option>
            <option value="ACCOUNTS_STAFF">ACCOUNTS_STAFF (Cashbook & Payments Only)</option>
            <option value="INVENTORY_STAFF">INVENTORY_STAFF (Warehouse & Kitchen Stock Only)</option>
            <option value="VIEWER">VIEWER (Read-Only Access)</option>
          </select>
        </div>
        <Input label={user ? 'New Password (Leave blank to keep unchanged)' : 'Password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" isLoading={loading}>{user ? 'Save Changes' : 'Create Account'}</Button>
        </div>
      </form>
    </Modal>
  );
};
