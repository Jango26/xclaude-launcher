import { ConfigService } from '../services/config-service.js';
import { PromptService } from '../services/prompt-service.js';
import { SettingsApplyService } from '../services/settings-apply-service.js';
import { CliError } from '../utils/errors.js';

export interface ApplyOptions {
  profile?: string;
  clear?: boolean;
  show?: boolean;
}

export async function runApplyCommand(options: ApplyOptions): Promise<number> {
  const applyService = new SettingsApplyService();
  const settingsPath = applyService.getSettingsPath();

  if (options.show) {
    const env = await applyService.showManagedEnv();
    const keys = Object.keys(env);
    if (keys.length === 0) {
      console.log(`No managed env in ${settingsPath}`);
      return 0;
    }
    console.log(`Managed env in ${settingsPath}:`);
    for (const key of keys) {
      console.log(`  ${key}=${env[key]}`);
    }
    return 0;
  }

  if (options.clear) {
    const removed = await applyService.clearManagedEnv();
    if (removed.length === 0) {
      console.log(`Nothing to clear in ${settingsPath}`);
    } else {
      console.log(`Cleared from ${settingsPath}:`);
      for (const key of removed) {
        console.log(`  - ${key}`);
      }
    }
    return 0;
  }

  const configService = new ConfigService();
  const config = await configService.getConfig();

  if (config.profiles.length === 0) {
    throw new CliError('No profiles configured. Run `xclaude config add` first.');
  }

  let profile;
  if (options.profile) {
    profile = await configService.getProfileByIdOrName(options.profile);
  } else {
    const promptService = new PromptService();
    const sorted = configService.sortProfilesByLastUsed(config.profiles, config.lastUsedProfileId);
    const selected = await promptService.chooseProfileOrBackOrExit(sorted, config.lastUsedProfileId);
    if (selected === 'back' || selected === 'exit') {
      return 0;
    }
    profile = selected;
  }

  const result = await applyService.applyProfile(profile);
  console.log(`Applied profile "${profile.name}" to ${settingsPath}`);
  if (result.written.length > 0) {
    console.log('Written:');
    for (const key of result.written) {
      console.log(`  + ${key}`);
    }
  }
  if (result.removed.length > 0) {
    console.log('Removed (not in profile):');
    for (const key of result.removed) {
      console.log(`  - ${key}`);
    }
  }
  if (result.written.length === 0 && result.removed.length === 0) {
    console.log('No changes (settings already in sync).');
  }
  return 0;
}
