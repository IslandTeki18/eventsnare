import { useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.profiles.generateAvatarUploadUrl);
  const setMyAvatar = useMutation(api.profiles.setMyAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      const { storageId } = (await response.json()) as { storageId: Id<'_storage'> };
      await setMyAvatar({ storageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Avatar</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="self-start rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload image'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
