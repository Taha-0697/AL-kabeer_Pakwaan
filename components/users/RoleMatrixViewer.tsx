'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Plus, Check, X, Edit } from 'lucide-react';
import { RoleEditorModal } from './RoleEditorModal';

interface PermissionItem {
  permissionId: string;
  key: string;
  label: string;
  category: string;
}

interface RoleItem {
  roleId: string;
  name: string;
  description?: string;
  rolePermissions: { permissionId: string }[];
}

export const RoleMatrixViewer: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();

      const permRes = await fetch('/api/permissions');
      const permD = await permRes.json();
      if (data.success) {
        setRoles(data.data);
        setPermissions(permD.data);
      }
    } catch {
      console.error('Failed to load matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Dynamic RBAC Matrix</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">View and customize role access across system modules</p>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={() => { setSelectedRole(null); setIsModalOpen(true); }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Custom Role
        </Button>
      </div>

      <Card glass className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-4">Permission Key / Label</th>
                {roles.map((r) => (
                  <th key={r.roleId} className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-900 dark:text-slate-100">{r.name}</span>
                      <button
                        onClick={() => { setSelectedRole(r); setIsModalOpen(true); }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                      >
                        <Edit className="h-2.5 w-2.5" /> Edit
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {permissions.map((p) => (
                <tr key={p.permissionId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-4 text-slate-800 dark:text-slate-200">
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 uppercase font-bold mr-2">{p.category}:</span>
                    {p.label}
                  </td>
                  {roles.map((r) => {
                    const isAllowed = r.rolePermissions.some((rp) => rp.permissionId === p.permissionId);
                    return (
                      <td key={r.roleId} className="p-4 text-center">
                        {isAllowed ? (
                          <span className="inline-flex p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /></span>
                        ) : (
                          <span className="inline-flex p-1 rounded-lg bg-red-500/10 text-red-400/50"><X className="h-4 w-4" /></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RoleEditorModal
        role={selectedRole}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
