import { Skeleton } from '@/components/ui/skeleton';

interface AuthSkeletonProps {
  variant?: 'login' | 'register' | 'card';
}

export function AuthSkeleton({ variant = 'login' }: AuthSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (variant === 'register') {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-3 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    );
  }

  // Default: login variant
  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}
