'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PermissionObj {
  permissionId: string;
  key: string;
  label: string;
  category: string;
}

interface RoleObj {
  roleId: string;
  name: string;
  description?: string;
  rolePermissions: { permissionId: string }[];
}

export const RoleEditorModal: React.FC<{
  role: RoleObj | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ role, isOpen, onClose, onSuccess }) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [allPermissions, setAllPermissions] = useState<PermissionObj[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/permissions').then((r) => r.json()).then((d) => d.success && setAllPermissions(d.data));
  }, []);

  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setDescription(role.description || '');
      setSelectedPermIds(role.rolePermissions.map((rp) => rp.permissionId));
    } else {
      setRoleName('');
      setDescription('');
      setSelectedPermIds([]);
    }
  }, [role]);

  const togglePermission = (id: string) => {
    setSelectedPermIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = role ? 'PUT' : 'POST';
    const body = role
      ? { roleId: role.roleId, description, permissionIds: selectedPermIds }
      : { name: roleName, description, permissionIds: selectedPermIds };

    await fetch('/api/roles', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? `Edit Permissions: ${role.name}` : 'Create New Custom Role'} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!role && <Input label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. EVENT_SUPERVISOR" required />}
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Role responsibilities..." />

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-slate-300">Assign Permissions (DB Driven)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-800 rounded-xl bg-slate-950">
            {allPermissions.map((p) => {
              const isChecked = selectedPermIds.includes(p.permissionId);
              return (
                <label key={p.permissionId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs">
                  <input type="checkbox" checked={isChecked} onChange={() => togglePermission(p.permissionId)} className="rounded border-slate-700 text-brand-500" />
                  <div>
                    <p className="font-bold text-slate-200">{p.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.key}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" isLoading={loading}>Save Role Permissions</Button>
        </div>
      </form>
    </Modal>
  );
};
