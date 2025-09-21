"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { Skeleton } from '../ui/skeleton';

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuth: React.FC<P> = (props) => {
    const router = useRouter();
    const { user, isAuthLoading } = useAppContext();

    useEffect(() => {
      if (!isAuthLoading && !user) {
        router.replace('/login');
      }
    }, [user, isAuthLoading, router]);

    if (isAuthLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />;
  };

  WithAuth.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuth;
}