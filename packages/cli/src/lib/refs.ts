// Typed references to the backend Convex functions the CLI calls. Built with
// makeFunctionReference (string "module:export") rather than importing the backend's generated
// `api`, so the CLI builds without depending on the backend's codegen output or its package
// export map. The arg/return shapes are declared here and must track the backend signatures in
// cliSessions.ts and cliDelivery.ts.

import { makeFunctionReference } from 'convex/server';

export interface PendingDelivery {
  localDeliveryId: string;
  eventId: string;
  attemptNumber: number;
  headers: Record<string, string>;
  body: string | null;
  bodyStorageUrl: string | null;
}

export interface SourceSummary {
  _id: string;
  name: string;
  provider: string;
  status: string;
}

export const refs = {
  validateToken: makeFunctionReference<
    'action',
    { token: string },
    { workspaceSlug: string; workspaceName: string }
  >('cliSessions:validateToken'),

  listSources: makeFunctionReference<'action', { token: string }, SourceSummary[]>(
    'cliSessions:listSources',
  ),

  registerSession: makeFunctionReference<
    'action',
    { token: string; sourceId: string },
    { sessionId: string; secret: string }
  >('cliSessions:registerSession'),

  heartbeat: makeFunctionReference<
    'mutation',
    { sessionId: string; secret: string },
    { active: boolean }
  >('cliSessions:heartbeat'),

  endSession: makeFunctionReference<'mutation', { sessionId: string; secret: string }, null>(
    'cliSessions:endSession',
  ),

  pending: makeFunctionReference<
    'query',
    { sessionId: string; secret: string },
    PendingDelivery[]
  >('cliDelivery:pending'),

  claimDelivery: makeFunctionReference<
    'mutation',
    { sessionId: string; secret: string; localDeliveryId: string },
    { claimed: boolean }
  >('cliDelivery:claimDelivery'),

  ackDelivery: makeFunctionReference<
    'mutation',
    {
      sessionId: string;
      secret: string;
      localDeliveryId: string;
      statusCode?: number;
      errorMessage?: string;
      latencyMs: number;
    },
    null
  >('cliDelivery:ackDelivery'),

  replayEvent: makeFunctionReference<'action', { token: string; eventId: string }, null>(
    'cliDelivery:replayEvent',
  ),
};
