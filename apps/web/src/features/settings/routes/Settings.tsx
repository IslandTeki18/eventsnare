import { UserProfile } from '@clerk/clerk-react';
import { ProtectedRoute } from '@/features/auth';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { PreferenceToggle } from '@/features/settings/components/PreferenceToggle';
import { AlertSettings } from '@/features/settings/components/AlertSettings';

export function Settings() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="flex flex-col gap-6">
          <SettingsSection title="Account" description="Manage email, password, and connected accounts.">
            <div className="overflow-hidden rounded-md border border-border">
              <UserProfile routing="hash" />
            </div>
          </SettingsSection>
          <SettingsSection title="Preferences" description="Personal preferences synced across devices.">
            <PreferenceToggle
              settingKey="emailNotifications"
              label="Email notifications"
              description="Receive product updates and important account emails."
            />
            <PreferenceToggle
              settingKey="marketingEmails"
              label="Marketing emails"
              description="Tips, new features, and occasional promotions."
            />
            <PreferenceToggle
              settingKey="weeklyDigest"
              label="Weekly digest"
              description="A summary of activity once per week."
            />
          </SettingsSection>
          <SettingsSection
            title="Alerts"
            description="Get notified by email or Slack when deliveries fail, events are dead-lettered, or you approach your usage limit."
          >
            <AlertSettings />
          </SettingsSection>
          <SettingsSection title="Privacy" description="Control how your data is used.">
            <PreferenceToggle
              settingKey="profileDiscoverable"
              label="Discoverable profile"
              description="Allow other users to find you by name or email."
            />
            <PreferenceToggle
              settingKey="shareUsageAnalytics"
              label="Share anonymous usage analytics"
              description="Help improve the product by sharing anonymized usage data."
            />
          </SettingsSection>
        </div>
      </div>
    </ProtectedRoute>
  );
}
