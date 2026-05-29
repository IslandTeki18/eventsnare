import { useState } from 'react';
import { ProtectedRoute } from '@/features/auth';
import { ProfileView } from '@/features/user-profile/components/ProfileView';
import { EditProfileDialog } from '@/features/user-profile/components/EditProfileDialog';

export function Profile() {
  const [editing, setEditing] = useState(false);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Edit
          </button>
        </div>
        <ProfileView />
        <EditProfileDialog open={editing} onClose={() => setEditing(false)} />
      </div>
    </ProtectedRoute>
  );
}
