'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook to safely access Zustand store after hydration
 * Prevents SSR/CSR hydration mismatch by returning default values until hydrated
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // We need to wait for the next tick after the Zustand store hydrates
    // to ensure the DOM matches
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return isHydrated;
}

/**
 * Hook that returns auth state only after hydration
 * Returns undefined values until hydrated to prevent hydration mismatch
 */
export function useAuthHydrated() {
  const isHydrated = useHydration();
  const { user, token, isAuthenticated } = useAuthStore();

  if (!isHydrated) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
    };
  }

  return {
    user,
    token,
    isAuthenticated,
    isHydrated: true,
  };
}
