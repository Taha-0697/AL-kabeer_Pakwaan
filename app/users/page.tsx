'use client';

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { UserManagementTable, UserItem } from '@/components/users/UserManagementTable';
import { UserModal } from '@/components/users/UserModal';
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal';
import { RoleMatrixViewer } from '@/components/users/RoleMatrixViewer';
import { Button } from '@/components/ui/Button';
import { UserPlus, ShieldCheck, Users, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (u: UserItem) => {
    await fetch(`/api/users/${u.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    fetchUsers();
  };

  const handleOpenReset = (u: UserItem) => {
    setResetUser(u);
    setIsResetOpen(true);
  };

  return (
    <PageContainer
      title="User Accounts & Role Permissions (RBAC)"
      subtitle="Manage user accounts, assign roles, reset passwords, and view granular screen & button permissions"
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUsers} isLoading={loading} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <PermissionGuard permission="action:user_edit">
            <Button
              variant="gold"
              size="sm"
              onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Create User Account
            </Button>
          </PermissionGuard>
        </div>
      }
    >
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'users' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Users className="h-4 w-4" />
          <span>User Directory ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'matrix' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Role Permission Matrix</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <UserManagementTable
          users={users}
          loading={loading}
          onEdit={(u) => { setSelectedUser(u); setIsModalOpen(true); }}
          onResetPassword={handleOpenReset}
          onToggleActive={handleToggleActive}
        />
      ) : (
        <RoleMatrixViewer />
      )}

      <UserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <ResetPasswordModal
        user={resetUser}
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setResetUser(null);
        }}
        onSuccess={fetchUsers}
      />
    </PageContainer>
  );
}
