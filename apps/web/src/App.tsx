import { Route, Routes } from 'react-router';
import { SignIn, SignUp } from '@/features/auth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Pricing, Billing } from '@/features/stripe-payments';
import '@/features/theme-settings/lib/bootstrap';
import { ThemeToggle } from '@/features/theme-settings';
import { Settings } from '@/features/settings';
import { Profile } from '@/features/user-profile';
import { Home } from '@/features/dashboard';
import { Onboarding } from '@/features/onboarding';
import { SourcesList, SourceCreate, SourceDetail } from '@/features/sources';
import { EventsList, EventDetail } from '@/features/events';
import { Analytics } from '@/features/analytics';
import { Usage } from '@/features/usage';
import { CliTokens } from '@/features/cli-tokens';
import { NotificationToaster } from '@/features/notifications/components/NotificationToaster';
import { NotificationBell } from '@/features/notifications';
// @scaffold:imports

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle />
      <NotificationBell />
      <NotificationToaster />
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
        <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
        <Route path="/usage" element={<DashboardLayout><Usage /></DashboardLayout>} />
        <Route path="/cli" element={<DashboardLayout><CliTokens /></DashboardLayout>} />
        <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
        <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
        <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />

        {/* Standalone marketing routes */}
        <Route path="/pricing" element={<Pricing />} />
        {/* @scaffold:routes */}
      </Routes>
    </div>
  );
}
