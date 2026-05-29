export type Role = 'admin' | 'member' | 'viewer' | (string & {});

export type Permission =
  | 'read:all'
  | 'write:all'
  | 'write:own'
  | 'manage:users'
  | 'manage:roles'
  | (string & {});

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['read:all', 'write:all', 'manage:users', 'manage:roles'],
  member: ['read:all', 'write:own'],
  viewer: ['read:all'],
};
