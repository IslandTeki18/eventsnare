import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

export function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <ClerkSignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main>
  );
}
