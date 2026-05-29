import { Route, Routes } from 'react-router';
import { Welcome } from '@/Welcome';
import { SignIn, SignUp } from '@/features/auth';
import '@/features/notifications/lib/bootstrap';
import { PushPlayground } from '@/features/notifications';
import { Pricing, Billing } from '@/features/stripe-payments';
import '@/features/theme-settings/lib/bootstrap';
import { Settings } from '@/features/settings';
import { Profile } from '@/features/user-profile';
// @scaffold:imports

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route path="/push" element={<PushPlayground />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        {/* @scaffold:routes */}
      </Routes>
    </div>
  );
}
