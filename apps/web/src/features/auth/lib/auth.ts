export { useAuth, useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';

import { useClerk } from '@clerk/clerk-react';

export function useSignOut(): () => Promise<void> {
  const { signOut } = useClerk();
  return async () => {
    await signOut();
  };
}
