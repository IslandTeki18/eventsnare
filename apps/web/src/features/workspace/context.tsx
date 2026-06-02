// Workspace provider. One workspace per user (SPEC FR-AUTH-2). On mount we ensure the
// workspace exists (idempotent mutation), then read it reactively. Product routes render
// through WorkspaceProvider so children can read the current workspace via useWorkspace.

import { useEffect, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { WorkspaceContext } from '@/features/workspace/workspaceContext';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useQuery(api.workspaces.getCurrent);
  const ensure = useMutation(api.workspaces.ensureForCurrentUser);

  useEffect(() => {
    // Provision on first visit if missing. Safe to call repeatedly (no-op when it exists).
    if (workspace === null) void ensure({});
  }, [workspace, ensure]);

  if (workspace === undefined || workspace === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Setting up your workspace…
      </div>
    );
  }

  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}
