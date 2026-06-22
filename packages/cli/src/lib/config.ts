// CLI credential storage. The device token and Convex deployment URL live in
// ~/.eventsnare/config.json with restrictive permissions (dir 0700, file 0600) since the token
// is a bearer credential.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CliConfig {
  convexUrl: string;
  token: string;
  workspaceSlug: string;
}

const CONFIG_DIR = join(homedir(), '.eventsnare');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function readConfig(): CliConfig | null {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CliConfig>;
    if (!parsed.convexUrl || !parsed.token) return null;
    return {
      convexUrl: parsed.convexUrl,
      token: parsed.token,
      workspaceSlug: parsed.workspaceSlug ?? '',
    };
  } catch {
    return null;
  }
}

export function writeConfig(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function requireConfig(): CliConfig {
  const config = readConfig();
  if (!config) {
    throw new Error('Not logged in. Run `eventsnare login --token <token>` first.');
  }
  return config;
}

export const CONFIG_PATH = CONFIG_FILE;
