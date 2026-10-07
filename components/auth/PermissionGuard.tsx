'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/useAuth';

export interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { hasPermission: canDo, loading } = useAuth();

  if (loading) return null;
  if (!canDo(permission)) return <>{fallback}</>;

  return <>{children}</>;
};
