'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // On mount, verify session is still valid
    if (accessToken) {
      refreshAuth();
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  return <>{children}</>;
}
