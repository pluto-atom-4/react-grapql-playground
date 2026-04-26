/* globals setTimeout */
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactNode {
  const { token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token === null) {
      // Token is null - redirect to login
      void router.push('/login');
      return;
    }

    if (token) {
      // Token exists - allow access (defer setState to next tick to avoid cascading renders)
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
    }
  }, [token, router]);

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
