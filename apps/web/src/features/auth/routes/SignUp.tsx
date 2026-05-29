import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export function SignUp() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
