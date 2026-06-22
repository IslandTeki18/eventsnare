// `eventsnare login --token <token> [--url <convexUrl>]`. Validates the device token against the
// backend and stores it (with the deployment URL) for later commands.

import { parseArgs } from 'node:util';
import { httpClient, resolveUrl } from '../lib/convexClient.js';
import { writeConfig, CONFIG_PATH } from '../lib/config.js';
import { refs } from '../lib/refs.js';

export async function login(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      token: { type: 'string' },
      url: { type: 'string' },
    },
    allowPositionals: false,
  });

  const token = values.token ?? process.env.EVENTSNARE_TOKEN;
  if (!token) {
    console.error('Missing --token. Create one in the dashboard under CLI.');
    return 1;
  }
  const url = resolveUrl(values.url);

  const client = httpClient(url);
  const { workspaceSlug, workspaceName } = await client.action(refs.validateToken, { token });

  writeConfig({ convexUrl: url, token, workspaceSlug });
  console.log(`Logged in to "${workspaceName}" (${workspaceSlug}).`);
  console.log(`Credentials saved to ${CONFIG_PATH}.`);
  return 0;
}
