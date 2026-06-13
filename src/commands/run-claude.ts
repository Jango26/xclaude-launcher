import { ConfigService } from '../services/config-service.js';
import { PromptService } from '../services/prompt-service.js';

interface RunClaudeOptions {
  profile?: string;
  list?: boolean;
  claudeArgs: string[];
}

export async function runClaudeCommand(options: RunClaudeOptions): Promise<number> {
  const configService = new ConfigService();
  const promptService = new PromptService();
  const config = await configService.getConfig();
  const sortedProfiles = configService.sortProfilesByLastUsed(config.profiles, config.lastUsedProfileId);

  if (options.list) {
    promptService.printProfiles(sortedProfiles, config.lastUsedProfileId);
    return 0;
  }

  const profile = options.profile
    ? await configService.getProfileByIdOrName(options.profile)
    : await promptService.chooseProfileForLaunch(sortedProfiles, config.lastUsedProfileId);

  await configService.markLastUsed(profile.id);

  const { ClaudeLauncherService } = await import('../services/claude-launcher.js');
  const launcher = new ClaudeLauncherService();
  return launcher.launch(profile, options.claudeArgs, config.globalEnv);
}
