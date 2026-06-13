import type { ProfileEnv } from '../models/config.js';
import { CliError } from './errors.js';

const ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

export function validateEnvKey(key: string): void {
  if (!ENV_KEY_PATTERN.test(key)) {
    throw new CliError(`Invalid ENV name: ${key}`);
  }
}

export function mergeEnv(...envs: ProfileEnv[]): NodeJS.ProcessEnv {
  return Object.assign({}, process.env, ...envs);
}

export function maskEnvValue(_key: string, value: string): string {
  return value;
}

export function buildProfileEnv(input: {
  anthropicAuthToken?: string;
  anthropicBaseUrl?: string;
  anthropicModel?: string;
  anthropicDefaultHaikuModel?: string;
  anthropicDefaultSonnetModel?: string;
  anthropicDefaultOpusModel?: string;
  claudeCodeSubagentModel?: string;
  extraEnv: ProfileEnv;
}): ProfileEnv {
  const env: ProfileEnv = {};

  if (input.anthropicAuthToken) {
    env.ANTHROPIC_AUTH_TOKEN = input.anthropicAuthToken;
  }

  if (input.anthropicBaseUrl) {
    env.ANTHROPIC_BASE_URL = input.anthropicBaseUrl;
  }

  if (input.anthropicModel) {
    env.ANTHROPIC_MODEL = input.anthropicModel;
  }

  if (input.anthropicDefaultHaikuModel) {
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = input.anthropicDefaultHaikuModel;
  }

  if (input.anthropicDefaultSonnetModel) {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = input.anthropicDefaultSonnetModel;
  }

  if (input.anthropicDefaultOpusModel) {
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = input.anthropicDefaultOpusModel;
  }

  if (input.claudeCodeSubagentModel) {
    env.CLAUDE_CODE_SUBAGENT_MODEL = input.claudeCodeSubagentModel;
  }

  for (const [key, value] of Object.entries(input.extraEnv)) {
    validateEnvKey(key);
    env[key] = value;
  }

  return env;
}
