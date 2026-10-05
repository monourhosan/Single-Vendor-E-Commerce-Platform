'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { getAuthToken } from '@/services/api';
import { authService } from '@/services/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && typeof window !== 'undefined') {
      const token = getAuthToken();
      const user = authService.getCurrentUser();
      if (!token || !user || user.role !== 'admin') {
        router.push('/admin/login');
      }
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
