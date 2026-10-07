'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserCheck, Mail, Phone, Edit, Power } from 'lucide-react';

export interface UserItem {
  userId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
}

export const UserManagementTable: React.FC<{
  users: UserItem[];
  onEdit: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
}> = ({ users, onEdit, onToggleActive }) => {
  return (
    <Card glass className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {users.map((u) => (
              <tr key={u.userId} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-100">
                    <UserCheck className="h-4 w-4 text-amber-500" />
                    <span>{u.name}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Phone className="h-3 w-3" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{u.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="gold">{u.role}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(u)} leftIcon={<Edit className="h-3.5 w-3.5" />}>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
