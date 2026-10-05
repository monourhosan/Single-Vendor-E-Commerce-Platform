'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getCurrentUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email: string, pass: string) => {
    const res = await authService.adminLogin(email, pass);
    setUser(res.user);
    return res;
  };

  const customerLogin = async (email: string, pass: string) => {
    const res = await authService.customerLogin(email, pass);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    adminLogin,
    customerLogin,
    logout,
  };
}
