'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useHydration } from '@/hooks/use-hydration';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard component for protecting routes
 *
 * - Waits for Zustand store hydration before making auth decisions
 * - Shows loading state during hydration
 * - Redirects unauthenticated users to login (when requireAuth=true)
 * - Redirects authenticated users away from auth pages (when requireAuth=false)
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const isHydrated = useHydration();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't
      router.replace(redirectTo);
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but shouldn't be on this page (e.g., login page)
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, requireAuth, redirectTo, router]);

  // Still hydrating - show loading state
  if (!isHydrated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  // After hydration, check auth state
  if (requireAuth && !isAuthenticated) {
    // Will redirect, show loading
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  if (!requireAuth && isAuthenticated) {
    // Will redirect, show loading
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  return <>{children}</>;
}
