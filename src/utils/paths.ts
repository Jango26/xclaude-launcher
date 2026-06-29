import os from 'node:os';
import path from 'node:path';

export function getLegacyConfigDir(): string {
  return path.join(os.homedir(), '.claude-launcher');
}

export function getLegacyConfigPath(): string {
  return path.join(getLegacyConfigDir(), 'config.json');
}

export function getConfigDir(): string {
  return path.join(os.homedir(), '.xclaude-launcher');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json');
}
