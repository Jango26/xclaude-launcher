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

  const selection = options.profile
    ? resolveProfileFlag(options.profile, configService)
    : promptService.chooseProfileForLaunch(sortedProfiles, config.lastUsedProfileId);

  const resolved = await selection;
  const isBlank = resolved === 'blank' || resolved === 'pure-blank';
  const profile = isBlank ? createBlankProfile() : resolved;
  const globalEnv = resolved === 'pure-blank' ? {} : config.globalEnv;

  if (!isBlank) {
    await configService.markLastUsed(profile.id);
  }

  const { ClaudeLauncherService } = await import('../services/claude-launcher.js');
  const launcher = new ClaudeLauncherService();
  return launcher.launch(profile, options.claudeArgs, globalEnv);
}

async function resolveProfileFlag(value: string, configService: ConfigService) {
  const normalized = value.toLowerCase();
  if (normalized === 'blank') return 'blank' as const;
  if (normalized === 'pure-blank' || normalized === 'pureblank') return 'pure-blank' as const;
  return configService.getProfileByIdOrName(value);
}

function createBlankProfile() {
  return {
    id: '__blank__',
    name: 'Blank',
    command: 'claude',
    args: [],
    env: {},
  };
}
