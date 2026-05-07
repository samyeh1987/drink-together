'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Don't block rendering while loading auth state
  // Individual pages can check `isLoading` if needed
  return <>{children}</>;
}
