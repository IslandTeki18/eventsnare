import { Route, Routes } from 'react-router';
import { SignIn, SignUp } from '@/features/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import '@/features/notifications/lib/bootstrap';
import { PushPlayground } from '@/features/notifications';
import { Pricing, Billing } from '@/features/stripe-payments';
import '@/features/theme-settings/lib/bootstrap';
import { Settings } from '@/features/settings';
import { Profile } from '@/features/user-profile';
import { Home } from '@/features/dashboard';
import { Onboarding } from '@/features/onboarding';
import { SourcesList, SourceCreate, SourceDetail } from '@/features/sources';
import { EventsList, EventDetail } from '@/features/events';
import { Usage } from '@/features/usage';
// @scaffold:imports

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        {/* Auth */}
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />

        {/* Product (authed, app shell, workspace-scoped) */}
        <Route path="/" element={<DashboardLayout><Home /></DashboardLayout>} />
        <Route
          path="/onboarding"
          element={<DashboardLayout><Onboarding /></DashboardLayout>}
        />
        <Route path="/sources" element={<DashboardLayout><SourcesList /></DashboardLayout>} />
        <Route
          path="/sources/new"
          element={<DashboardLayout><SourceCreate /></DashboardLayout>}
        />
        <Route
          path="/sources/:sourceId"
          element={<DashboardLayout><SourceDetail /></DashboardLayout>}
        />
        <Route path="/events" element={<DashboardLayout><EventsList /></DashboardLayout>} />
        <Route
          path="/events/:eventId"
          element={<DashboardLayout><EventDetail /></DashboardLayout>}
        />
        <Route path="/usage" element={<DashboardLayout><Usage /></DashboardLayout>} />
        <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
        <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
        <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />

        {/* Standalone demo/marketing routes */}
        <Route path="/push" element={<PushPlayground />} />
        <Route path="/pricing" element={<Pricing />} />
        {/* @scaffold:routes */}
      </Routes>
    </div>
  );
}
