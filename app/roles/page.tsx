'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Plus, ChevronRight, Check, X, Loader2, Bell } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { clsx } from 'clsx';

interface Permission {
  permissionId: string;
  key: string;
  label: string;
  category: string;
}

interface Role {
  roleId: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  rolePermissions: { permissionId: string; permission: Permission }[];
}

type Panel = 'permissions' | 'add-role' | 'manage-permissions' | null;

export default function RolesPage() {
  const { t, isRTL } = useLanguage();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add role form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  // Manage permission form
  const [permKey, setPermKey] = useState('');
  const [permLabel, setPermLabel] = useState('');
  const [permCategory, setPermCategory] = useState('Custom');

  // Selected permission IDs in panel
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/permissions').then(r => r.json()),
    ]);
    if (rolesRes.success) setRoles(rolesRes.data);
    if (permsRes.success) setAllPermissions(permsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openPermissionsPanel = (role: Role) => {
    setSelectedRole(role);
    setCheckedIds(new Set(role.rolePermissions.map(rp => rp.permissionId)));
    setPanel('permissions');
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId: selectedRole.roleId, permissionIds: [...checkedIds] }),
    });
    setSaving(false);
    
    // Update local state directly instead of re-fetching everything
    const updatedPermissions = [...checkedIds].map(id => ({
      permissionId: id,
      permission: allPermissions.find(p => p.permissionId === id)!
    })).filter(rp => rp.permission);
    
    const updatedRoles = roles.map(r => r.roleId === selectedRole.roleId ? { ...r, rolePermissions: updatedPermissions } : r);
    setRoles(updatedRoles);
    setSelectedRole({ ...selectedRole, rolePermissions: updatedPermissions });
  };

  const addRole = async () => {
    setError('');
    if (!newName.trim()) { setError('Role name required'); return; }
    setAddLoading(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim().toUpperCase().replace(/\s+/g, '_'), description: newDesc }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (data.success) {
      setRoles([...roles, { ...data.data, rolePermissions: [] }]);
      setNewName(''); setNewDesc('');
      setPanel(null);
    } else {
      setError(data.message || 'Failed');
    }
  };

  const addPermission = async () => {
    setError('');
    if (!permKey.trim() || !permLabel.trim()) { setError('Key and Label are required'); return; }
    setAddLoading(true);
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: permKey.trim(), label: permLabel.trim(), category: permCategory.trim() }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (data.success) {
      setAllPermissions([...allPermissions, data.data]);
      setPermKey(''); setPermLabel('');
    } else {
      setError(data.message || 'Failed');
    }
  };

  const deletePermission = async (id: string) => {
    if (!confirm('Delete this permission?')) return;
    const res = await fetch(`/api/permissions?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setAllPermissions(allPermissions.filter(p => p.permissionId !== id));
      // Remove from existing roles visually
      setRoles(roles.map(r => ({ ...r, rolePermissions: r.rolePermissions.filter(rp => rp.permissionId !== id) })));
    }
  };

  // Group permissions by category
  const permsByCategory = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  const togglePerm = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategory = (perms: Permission[]) => {
    const allChecked = perms.every(p => checkedIds.has(p.permissionId));
    setCheckedIds(prev => {
      const next = new Set(prev);
      perms.forEach(p => allChecked ? next.delete(p.permissionId) : next.add(p.permissionId));
      return next;
    });
  };

  return (
    <PageContainer
      title={t('roles')}
      subtitle="Manage system roles and screen/button permissions — all live from database"
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPanel('manage-permissions')}>
            Manage Permissions
          </Button>
          <Button variant="gold" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setPanel('add-role')}>
            {t('addRole')}
          </Button>
        </div>
      }
    >
      <div className={clsx('flex gap-6', isRTL && 'flex-row-reverse')}>
        {/* ── Roles List ──────────────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : roles.length === 0 ? (
            <Card glass className="text-center py-12 text-slate-400">{t('noData')}</Card>
          ) : roles.map(role => (
            <Card
              key={role.roleId}
              glass
              className={clsx(
                'flex items-center gap-4 cursor-pointer transition-all hover:border-amber-500/40',
                selectedRole?.roleId === role.roleId && panel === 'permissions' && 'border-amber-500/60 bg-amber-500/5',
                isRTL && 'flex-row-reverse'
              )}
              onClick={() => openPermissionsPanel(role)}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-amber-500 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-sm">{role.name}</h3>
                  {role.isSystemRole && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">System</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{role.description || 'No description'}</p>
                <p className="text-xs text-brand-500 mt-1">{role.rolePermissions.length} permissions</p>
              </div>
              <ChevronRight className={clsx('h-4 w-4 text-slate-600 shrink-0', isRTL && 'rotate-180')} />
            </Card>
          ))}
        </div>

        {/* ── Side Panel ──────────────────────────────────────────── */}
        {panel && (
          <div className={clsx('w-[420px] shrink-0', isRTL && 'order-first')}>
            <Card glass className="space-y-4 h-full">
              {panel === 'add-role' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100">{t('addRole')}</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Input label="Role Name (e.g. MANAGER)" value={newName} onChange={e => setNewName(e.target.value)} />
                  <Input label={t('description')} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                  <Button variant="gold" className="w-full" onClick={addRole} isLoading={addLoading}>{t('save')}</Button>
                </>
              )}

              {panel === 'manage-permissions' && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100">Manage Permissions</h3>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-amber-500 font-bold uppercase">Add New Permission</p>
                    <Input label="Permission Key (e.g. menu.create)" value={permKey} onChange={e => setPermKey(e.target.value)} />
                    <Input label="Label (e.g. Can Create Menu)" value={permLabel} onChange={e => setPermLabel(e.target.value)} />
                    <Input label="Category (e.g. Custom)" value={permCategory} onChange={e => setPermCategory(e.target.value)} />
                    <Button variant="gold" className="w-full" onClick={addPermission} isLoading={addLoading}>Add Permission</Button>
                  </div>

                  <div className="mt-4 max-h-[40vh] overflow-y-auto space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Existing Permissions</p>
                    {allPermissions.map(p => (
                      <div key={p.permissionId} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div>
                          <p className="text-xs font-medium text-slate-200">{p.label}</p>
                          <p className="text-[10px] text-slate-500">{p.key} &bull; {p.category}</p>
                        </div>
                        <button onClick={() => deletePermission(p.permissionId)} className="text-red-500 hover:text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded">Delete</button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {panel === 'permissions' && selectedRole && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100">{selectedRole.name}</h3>
                      <p className="text-xs text-slate-400">{t('managePermissions')}</p>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                    {Object.entries(permsByCategory).map(([cat, perms]) => {
                      const allChecked = perms.every(p => checkedIds.has(p.permissionId));
                      const someChecked = perms.some(p => checkedIds.has(p.permissionId));
                      return (
                        <div key={cat} className="space-y-2">
                          <button
                            onClick={() => toggleCategory(perms)}
                            className={clsx(
                              'flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors',
                              allChecked ? 'bg-brand-600/20 text-brand-400' : someChecked ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500 hover:text-slate-300',
                              isRTL && 'text-right flex-row-reverse'
                            )}
                          >
                            <span className={clsx(
                              'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                              allChecked ? 'bg-brand-600 border-brand-600' : someChecked ? 'border-amber-500' : 'border-slate-700'
                            )}>
                              {allChecked && <Check className="h-3 w-3 text-white" />}
                              {!allChecked && someChecked && <div className="h-2 w-2 rounded-sm bg-amber-500" />}
                            </span>
                            {cat}
                          </button>
                          <div className="pl-4 space-y-1">
                            {perms.map(p => (
                              <label key={p.permissionId} className={clsx('flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-slate-800/50', isRTL && 'flex-row-reverse')}>
                                <span className={clsx(
                                  'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                  checkedIds.has(p.permissionId) ? 'bg-brand-600 border-brand-600' : 'border-slate-700 group-hover:border-slate-500'
                                )}>
                                  {checkedIds.has(p.permissionId) && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <input type="checkbox" className="hidden" checked={checkedIds.has(p.permissionId)} onChange={() => togglePerm(p.permissionId)} />
                                <div className={clsx('flex-1', isRTL && 'text-right')}>
                                  <p className="text-xs font-medium text-slate-200">{p.label}</p>
                                  <p className="text-[10px] text-slate-500">{p.key}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={clsx('flex gap-2 pt-2 border-t border-slate-800', isRTL && 'flex-row-reverse')}>
                    <Button variant="outline" size="sm" onClick={() => setPanel(null)} className="flex-1">{t('cancel')}</Button>
                    <Button variant="gold" size="sm" onClick={savePermissions} isLoading={saving} className="flex-1">{t('save')}</Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
