import type { ReactNode } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { convex } from '@/lib/convex';

interface AppClerkProviderProps {
  children: ReactNode;
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppClerkProvider({ children }: AppClerkProviderProps) {
  if (!PUBLISHABLE_KEY) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env');
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
