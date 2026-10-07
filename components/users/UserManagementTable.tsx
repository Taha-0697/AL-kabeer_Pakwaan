'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserCheck, Mail, Phone, Edit, Power, Shield, KeyRound } from 'lucide-react';

export interface UserItem {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  roleId?: string | null;
  role: string;
  roleName?: string;
  roleDescription?: string | null;
  isActive: boolean;
}

export const UserManagementTable: React.FC<{
  users: UserItem[];
  loading?: boolean;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
}> = ({ users, loading, onEdit, onResetPassword, onToggleActive }) => {
  return (
    <Card glass className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                  <td className="p-4"><div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-4 space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <UserCheck className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{u.name}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Phone className="h-3 w-3" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{u.email}</span>
                  </div>
                </td>
                <td className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="gold" className="font-bold flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {u.role}
                    </Badge>
                  </div>
                  {u.roleDescription && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.roleDescription}</p>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResetPassword(u)}
                      leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(u)}
                      leftIcon={<Edit className="h-3.5 w-3.5" />}
                    >
                      Edit Role
                    </Button>
                    <Button
                      variant={u.isActive ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => onToggleActive(u)}
                      leftIcon={<Power className="h-3.5 w-3.5" />}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
