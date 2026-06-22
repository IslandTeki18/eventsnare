#!/usr/bin/env node
// eventsnare CLI entrypoint. Dispatches to subcommands; each parses its own flags.

import { login } from './commands/login.js';
import { listen } from './commands/listen.js';
import { replay } from './commands/replay.js';

const USAGE = `eventsnare — forward live webhooks to your local machine

Usage:
  eventsnare login   --token <token> [--url <convexUrl>]
  eventsnare listen  --source <id> --forward <localUrl>
  eventsnare replay  --event <id>

Env:
  EVENTSNARE_CONVEX_URL   default Convex deployment URL (overridden by --url)
  EVENTSNARE_TOKEN        default device token for login
`;

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'login':
      return await login(rest);
    case 'listen':
      return await listen(rest);
    case 'replay':
      return await replay(rest);
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      console.log(USAGE);
      return command === undefined ? 1 : 0;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.error(USAGE);
      return 1;
  }
}

main()
  .then((code) => {
    if (code !== 0) process.exit(code);
  })
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
