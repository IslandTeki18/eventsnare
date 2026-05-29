import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { AvatarUpload } from '@/features/user-profile/components/AvatarUpload';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const data = useQuery(api.profiles.getMyProfile);
  const upsert = useMutation(api.profiles.upsertMyProfile);

  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBio(data?.profile?.bio ?? '');
    setLocation(data?.profile?.location ?? '');
    setWebsite(data?.profile?.website ?? '');
  }, [open, data?.profile?.bio, data?.profile?.location, data?.profile?.website]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await upsert({
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="mb-5">
          <AvatarUpload />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Location</span>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Website</span>
            <input
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
