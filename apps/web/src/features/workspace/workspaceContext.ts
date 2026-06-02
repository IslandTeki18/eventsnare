import { createContext, useContext } from 'react';
import type { Doc } from '@convex/_generated/dataModel';

export type Workspace = Doc<'workspaces'>;

export const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return workspace;
}
