import { UserProfile } from '@clerk/clerk-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { PreferenceToggle } from '@/features/settings/components/PreferenceToggle';
import { AlertSettings } from '@/features/settings/components/AlertSettings';
import { ThemeToggle } from '@/features/theme-settings';

export function Settings() {
  return (
    <>
      <PageHeader title="Settings">
        <span className="text-sm text-subtle">Changes save automatically</span>
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        <SettingsSection
          title="Account"
          description="Manage email, password, and connected accounts."
        >
          <div className="overflow-hidden rounded-lg border border-border">
            <UserProfile routing="hash" />
          </div>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <PreferenceToggle
            settingKey="emailNotifications"
            label="Email notifications"
            description="Product updates and important account emails."
          />
          <PreferenceToggle
            settingKey="marketingEmails"
            label="Marketing emails"
            description="Tips, new features, and occasional promotions."
          />
          <PreferenceToggle
            settingKey="weeklyDigest"
            label="Weekly summary"
            description="A recap of your delivery activity once a week."
          />
        </SettingsSection>

        <SettingsSection
          title="Alerts"
          description="We'll tell you when deliveries start failing, when an event gives up after all its retries, or when you're close to your plan limit."
        >
          <AlertSettings />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <PreferenceToggle
            settingKey="profileDiscoverable"
            label="Let others find me"
            description="Teammates can search for you by name or email."
          />
          <PreferenceToggle
            settingKey="shareUsageAnalytics"
            label="Share anonymous usage data"
            description="Helps us improve the product. Never includes your event contents."
          />
        </SettingsSection>

        <SettingsSection title="Appearance" last>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm">Theme</div>
              <div className="mt-0.5 text-sm leading-[18px] text-muted-foreground">
                Applies to this browser only.
              </div>
            </div>
            <ThemeToggle className="flex-shrink-0" />
          </div>
        </SettingsSection>
      </div>
    </>
  );
}
