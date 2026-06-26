// Workspace provider. One workspace per user (SPEC FR-AUTH-2). On mount we ensure the
// workspace exists (idempotent mutation), then read it reactively. Product routes render
// through WorkspaceProvider so children can read the current workspace via useWorkspace.
//
// ensureForCurrentUser gates free-tier provisioning on a verified phone (abuse prevention):
// it may decline to create a workspace and instead return a gate the provider renders below.

import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { WorkspaceContext } from '@/features/workspace/workspaceContext';

type EnsureResult =
  | { status: 'ok' }
  | { status: 'needs_phone' }
  | { status: 'free_tier_used'; lifetimeEvents: number }
  | { status: 'disposable_email' };

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-muted-foreground">
      <div className="max-w-md">{children}</div>
    </div>
  );
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useQuery(api.workspaces.getCurrent);
  const ensure = useMutation(api.workspaces.ensureForCurrentUser);
  const [gate, setGate] = useState<EnsureResult | null>(null);

  useEffect(() => {
    if (workspace !== null) return;
    let cancelled = false;
    const run = async () => {
      const res = (await ensure({})) as EnsureResult;
      if (cancelled) return;
      setGate(res);
      // needs_phone resolves once the Clerk webhook lands; stop polling on any terminal state.
      if (res.status !== 'needs_phone') clearInterval(timer);
    };
    const timer = setInterval(() => void run(), 2000);
    void run();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [workspace, ensure]);

  if (workspace) {
    return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
  }

  if (gate?.status === 'free_tier_used') {
    return (
      <Centered>
        This phone number has already used its free tier ({gate.lifetimeEvents.toLocaleString()}{' '}
        events). <Link to="/billing" className="underline">Upgrade to continue.</Link>
      </Centered>
    );
  }

  if (gate?.status === 'disposable_email') {
    return <Centered>Please sign up with a non-disposable email address.</Centered>;
  }

  if (gate?.status === 'needs_phone') {
    return <Centered>Verifying your phone…</Centered>;
  }

  return <Centered>Setting up your workspace…</Centered>;
}
