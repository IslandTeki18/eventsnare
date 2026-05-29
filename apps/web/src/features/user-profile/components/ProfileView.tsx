import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export function ProfileView() {
  const data = useQuery(api.profiles.getMyProfile);

  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }
  if (data === null) {
    return <p className="text-sm text-muted-foreground">Profile not available.</p>;
  }

  const { user, profile, avatarUrl } = data;
  const displayName: string = user.name ?? user.email;
  const initials = displayName
    .split(/\s+/)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex items-start gap-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${displayName} avatar`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={`${displayName} avatar`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {initials || '?'}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-lg font-semibold">{displayName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {profile?.location ? (
            <p className="text-sm text-muted-foreground">{profile.location}</p>
          ) : null}
        </div>
      </div>
      {profile?.bio ? (
        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {profile.bio}
        </p>
      ) : null}
      {profile?.website ? (
        <a
          href={profile.website}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          {profile.website}
        </a>
      ) : null}
    </div>
  );
}
