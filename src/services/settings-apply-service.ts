import type { Profile } from '../models/config.js';
import { ClaudeSettingsRepository, type SettingsEdit } from '../adapters/claude-settings-repo.js';
import { MANAGED_ENV_KEYS } from '../utils/managed-keys.js';

export interface ApplyResult {
  written: string[];
  removed: string[];
}

export class SettingsApplyService {
  constructor(private readonly repository = new ClaudeSettingsRepository()) {}

  getSettingsPath(): string {
    return this.repository.getPath();
  }

  async showManagedEnv(): Promise<Record<string, string>> {
    const env = await this.repository.readEnv();
    const result: Record<string, string> = {};
    for (const key of MANAGED_ENV_KEYS) {
      if (env[key] !== undefined) {
        result[key] = env[key];
      }
    }
    return result;
  }

  async applyProfile(profile: Profile): Promise<ApplyResult> {
    const current = await this.repository.readEnv();
    const edits: SettingsEdit[] = [];
    const written: string[] = [];
    const removed: string[] = [];

    for (const key of MANAGED_ENV_KEYS) {
      const next = profile.env[key];
      const existing = current[key];
      if (next !== undefined) {
        if (existing !== next) {
          edits.push({ path: ['env', key], value: next });
        }
        written.push(key);
      } else if (existing !== undefined) {
        edits.push({ path: ['env', key], value: undefined });
        removed.push(key);
      }
    }

    await this.repository.applyEdits(edits);
    return { written, removed };
  }

  async clearManagedEnv(): Promise<string[]> {
    const current = await this.repository.readEnv();
    const edits: SettingsEdit[] = [];
    const removed: string[] = [];

    for (const key of MANAGED_ENV_KEYS) {
      if (current[key] !== undefined) {
        edits.push({ path: ['env', key], value: undefined });
        removed.push(key);
      }
    }

    await this.repository.applyEdits(edits);
    return removed;
  }
}
