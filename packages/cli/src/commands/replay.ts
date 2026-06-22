// `eventsnare replay --event <id>`. Re-schedules an event for delivery. If a `listen` session is
// active for its source the event is routed to localhost; otherwise it goes to the production
// forward URL.

import { parseArgs } from 'node:util';
import { requireConfig } from '../lib/config.js';
import { httpClient } from '../lib/convexClient.js';
import { refs } from '../lib/refs.js';

export async function replay(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      event: { type: 'string' },
    },
    allowPositionals: false,
  });

  if (!values.event) {
    console.error('Missing --event <id>.');
    return 1;
  }

  const config = requireConfig();
  const http = httpClient(config.convexUrl);
  await http.action(refs.replayEvent, { token: config.token, eventId: values.event });
  console.log(`Replayed event ${values.event}.`);
  return 0;
}
