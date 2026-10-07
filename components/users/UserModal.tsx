'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserItem } from './UserManagementTable';

interface SystemRole {
  roleId: string;
  name: string;
  description?: string | null;
}

export const UserModal: React.FC<{
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available roles with roleId from system Role table
  useEffect(() => {
    if (isOpen) {
      setRolesLoading(true);
      fetch('/api/roles')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setSystemRoles(d.data);

            if (user) {
              // Match by user.roleId or by role name
              const matched = d.data.find(
                (r: SystemRole) =>
                  (user.roleId && r.roleId === user.roleId) ||
                  r.name.toLowerCase() === user.role?.toLowerCase()
              );
              if (matched) setSelectedRoleId(matched.roleId);
            } else if (d.data.length > 0 && !selectedRoleId) {
              setSelectedRoleId(d.data[0].roleId);
            }
          }
        })
        .catch((err) => console.error('Failed to load roles', err))
        .finally(() => setRolesLoading(false));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      if (user.roleId) {
        setSelectedRoleId(user.roleId);
      }
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const matchedRole = systemRoles.find((r) => r.roleId === selectedRoleId);
    const endpoint = user ? `/api/users/${user.userId}` : '/api/users';
    const method = user ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          roleId: selectedRoleId,
          role: matchedRole ? matchedRole.name : 'VIEWER',
          password,
        }),
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
        {error && <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl font-semibold">{error}</p>}
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shehzad Ahmed" required />
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. user@alkabeer.com" disabled={!!user} required />
        <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
            Assigned System Role (Matched by Role ID)
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          >
            {systemRoles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.name} {r.description ? `— ${r.description}` : ''}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={user ? 'New Password (Leave blank to keep unchanged)' : 'Password'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={user ? '••••••••' : 'Enter strong password'}
          required={!user}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" isLoading={loading}>{user ? 'Save Changes' : 'Create Account'}</Button>
        </div>
      </form>
    </Modal>
  );
};
