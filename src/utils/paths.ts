import os from 'node:os';
import path from 'node:path';

export function getConfigDir(): string {
  return path.join(os.homedir(), '.claude-launcher');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}
