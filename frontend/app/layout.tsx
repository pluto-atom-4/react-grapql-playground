import type { Metadata } from 'next';
import type { ReactNode, ReactElement } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { ApolloWrapper } from './apollo-wrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boltline Test Dashboard',
  description: 'Hardware test workflow management for Stoke Space manufacturing',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
