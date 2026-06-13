import { confirm, input, select } from '@inquirer/prompts';
import type { Profile, ProfileEnv, PromptProfileInput } from '../models/config.js';
import { maskEnvValue, validateEnvKey } from '../utils/env.js';
import { CliError } from '../utils/errors.js';

const PROFILE_FIRST_CLASS_KEYS = new Set([
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
]);


export class PromptService {
  async chooseProfile(profiles: Profile[], lastUsedProfileId?: string): Promise<Profile> {
    if (profiles.length === 0) {
      throw new CliError('No profiles available yet. Run xclaude config add first');
    }

    const answer = await select({
      message: 'Choose a profile',
      choices: profiles.map((profile) => ({
        name: this.formatProfileLabel(profile, lastUsedProfileId),
        value: profile.id,
      })),
    });

    const profile = profiles.find((item) => item.id === answer);
    if (!profile) {
      throw new CliError('Selected profile does not exist');
    }

    return profile;
  }

  async chooseProfileForLaunch(profiles: Profile[], lastUsedProfileId?: string): Promise<Profile> {
    if (profiles.length === 0) {
      throw new CliError('No profiles available yet. Run xclaude config add first');
    }

    const answer = await select({
      message: 'Launch profile',
      choices: [
        ...profiles.map((profile) => ({
          name: this.formatProfileLabel(profile, lastUsedProfileId),
          value: profile.id,
        })),
        {
          name: 'Exit',
          value: '__exit__',
          description: 'Exit without launching Claude',
        },
      ],
    });

    if (answer === '__exit__') {
      throw new CliError('Launch cancelled');
    }

    const profile = profiles.find((item) => item.id === answer);
    if (!profile) {
      throw new CliError('Selected profile does not exist');
    }

    return profile;
  }

  async chooseConfigAction(): Promise<'list' | 'add' | 'edit' | 'global-env' | 'path' | 'exit'> {
    return select({
      message: 'Choose a config action',
      choices: [
        { name: 'List profiles', value: 'list' },
        { name: 'Add profile', value: 'add' },
        { name: 'Edit profile', value: 'edit' },
        { name: 'Manage global ENV', value: 'global-env' },
        { name: 'Show config path', value: 'path' },
        { name: 'Exit', value: 'exit' },
      ],
    });
  }

  printGlobalEnv(env: ProfileEnv): void {
    const entries = Object.entries(env);
    console.log('');
    console.log('Global ENV');
    console.log('');
    if (entries.length === 0) {
      console.log('  (no env)');
      console.log('');
      return;
    }
    for (const [key, value] of entries) {
      console.log(`  ${key}`);
      console.log(`    ${value}`);
      console.log('');
    }
  }

  async chooseGlobalEnvAction(): Promise<'view' | 'add' | 'edit' | 'remove' | 'back' | 'exit'> {
    return select({
      message: 'Global ENV',
      choices: [
        { name: 'View', value: 'view' },
        { name: 'Add', value: 'add' },
        { name: 'Edit', value: 'edit' },
        { name: 'Remove', value: 'remove' },
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' },
      ],
    });
  }

  async chooseGlobalEnvKey(env: ProfileEnv, message: string): Promise<string | 'back'> {
    const entries = Object.entries(env);
    if (entries.length === 0) {
      return 'back';
    }

    const answer = await select({
      message,
      choices: [
        ...entries.map(([key, value]) => ({
          name: `${key}=${maskEnvValue(key, value)}`,
          value: key,
        })),
        { name: 'Back', value: '__back__' },
      ],
    });

    return answer === '__back__' ? 'back' : answer;
  }

  async promptGlobalEnvEntry(initialKey?: string, initialValue?: string): Promise<{ key: string; value: string }> {
    const key = (await input({
      message: 'ENV name',
      default: initialKey,
      validate: (value) => {
        try {
          validateEnvKey(value.trim());
          return true;
        } catch (error) {
          return (error as Error).message;
        }
      },
    })).trim();

    const value = await input({
      message: `ENV value (${key})`,
      default: initialValue,
    });

    return { key, value };
  }

  async confirmRemoveGlobalEnv(key: string): Promise<boolean> {
    return confirm({ message: `Remove ${key}?`, default: false });
  }

  async confirmLaunchProfile(profile: Profile, extraArgs: string[] = []): Promise<boolean> {
    console.log(`About to launch with profile: ${profile.name} (${profile.id})`);
    for (const [key, value] of Object.entries(profile.env)) {
      console.log(`  ${key}=${maskEnvValue(key, value)}`);
    }
    console.log(`  Claude args=${extraArgs.length > 0 ? extraArgs.join(' ') : '(none)'}`);

    return confirm({
      message: 'Launch Claude?',
      default: true,
    });
  }

  async chooseProfileOrBackOrExit(
    profiles: Profile[],
    lastUsedProfileId?: string,
  ): Promise<Profile | 'back' | 'exit'> {
    if (profiles.length === 0) {
      return 'back';
    }

    const answer = await select({
      message: 'Choose a profile',
      choices: [
        ...profiles.map((profile) => ({
          name: this.formatProfileLabel(profile, lastUsedProfileId),
          value: profile.id,
        })),
        {
          name: 'Back',
          value: '__back__',
          description: 'Return to the previous menu',
        },
        {
          name: 'Exit',
          value: '__exit__',
          description: 'Exit config',
        },
      ],
    });

    if (answer === '__back__') {
      return 'back';
    }

    if (answer === '__exit__') {
      return 'exit';
    }

    return profiles.find((item) => item.id === answer) ?? 'back';
  }

  async chooseProfileAction(): Promise<'view' | 'edit' | 'remove' | 'back' | 'exit'> {
    return select({
      message: 'Choose an action',
      choices: [
        { name: 'View', value: 'view' },
        { name: 'Edit', value: 'edit' },
        { name: 'Remove', value: 'remove' },
        { name: 'Back', value: 'back' },
        { name: 'Exit', value: 'exit' },
      ],
    });
  }

  printProfileEnv(profile: Profile): void {
    const entries = Object.entries(profile.env);

    console.log('');
    console.log(`Profile: ${profile.name}  (${profile.id})`);
    console.log('');

    if (entries.length === 0) {
      console.log('  (no env)');
      console.log('');
      return;
    }

    for (const [key, value] of entries) {
      console.log(`  ${key}`);
      console.log(`    ${value}`);
      console.log('');
    }
  }

  async confirmRemoveProfile(profile: Profile): Promise<boolean> {
    return confirm({
      message: `Remove profile ${profile.name}?`,
      default: false,
    });
  }

  async promptProfileInput(existing?: Profile): Promise<PromptProfileInput | 'back' | 'exit'> {
    const name = await input({
      message: 'Profile name',
      default: existing?.name,
      validate: (value) => (value.trim() ? true : 'Profile name is required'),
    });

    const anthropicAuthToken = await input({
      message: 'ANTHROPIC_AUTH_TOKEN',
      default: existing?.env.ANTHROPIC_AUTH_TOKEN,
    });

    const anthropicBaseUrl = await input({
      message: 'ANTHROPIC_BASE_URL',
      default: existing?.env.ANTHROPIC_BASE_URL,
    });

    const anthropicModel = await input({
      message: 'ANTHROPIC_MODEL',
      default: existing?.env.ANTHROPIC_MODEL,
    });

    const anthropicDefaultHaikuModel = await input({
      message: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
      default: existing?.env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
    });

    const anthropicDefaultSonnetModel = await input({
      message: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
      default: existing?.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
    });

    const anthropicDefaultOpusModel = await input({
      message: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
      default: existing?.env.ANTHROPIC_DEFAULT_OPUS_MODEL,
    });

    const claudeCodeSubagentModel = await input({
      message: 'CLAUDE_CODE_SUBAGENT_MODEL',
      default: existing?.env.CLAUDE_CODE_SUBAGENT_MODEL,
    });

    const extraEnv = await this.promptExtraEnv(existing?.env ?? {}, PROFILE_FIRST_CLASS_KEYS);

    return {
      name: name.trim(),
      anthropicAuthToken: anthropicAuthToken.trim() || undefined,
      anthropicBaseUrl: anthropicBaseUrl.trim() || undefined,
      anthropicModel: anthropicModel.trim() || undefined,
      anthropicDefaultHaikuModel: anthropicDefaultHaikuModel.trim() || undefined,
      anthropicDefaultSonnetModel: anthropicDefaultSonnetModel.trim() || undefined,
      anthropicDefaultOpusModel: anthropicDefaultOpusModel.trim() || undefined,
      claudeCodeSubagentModel: claudeCodeSubagentModel.trim() || undefined,
      extraEnv,
    };
  }

  printProfiles(profiles: Profile[], lastUsedProfileId?: string): void {
    if (profiles.length === 0) {
      console.log('No profiles');
      return;
    }

    for (const profile of profiles) {
      const markers: string[] = [];
      if (profile.id === lastUsedProfileId) {
        markers.push('recent');
      }
      const marker = markers.length > 0 ? ` [${markers.join(' / ')}]` : '';
      console.log(`- ${profile.name} (${profile.id})${marker}`);
      for (const [key, value] of Object.entries(profile.env)) {
        console.log(`  ${key}=${maskEnvValue(key, value)}`);
      }
    }
  }

  private async promptExtraEnv(existingEnv: ProfileEnv, skipKeys: Set<string>): Promise<ProfileEnv> {
    const extraEnv: ProfileEnv = {};
    const presetEntries = Object.entries(existingEnv).filter(([key]) => !skipKeys.has(key));

    for (const [key, value] of presetEntries) {
      const keep = await confirm({
        message: `Keep ${key}=${maskEnvValue(key, value)}?`,
        default: true,
      });

      if (keep) {
        extraEnv[key] = value;
      }
    }

    while (
      await confirm({
        message: 'Add a custom ENV?',
        default: false,
      })
    ) {
      const key = (await input({
        message: 'ENV name',
        validate: (value) => {
          try {
            validateEnvKey(value.trim());
            return true;
          } catch (error) {
            return (error as Error).message;
          }
        },
      })).trim();

      const value = await input({
        message: `ENV value (${key})`,
      });

      extraEnv[key] = value;
    }

    return extraEnv;
  }

  private formatProfileLabel(profile: Profile, lastUsedProfileId?: string): string {
    const markers: string[] = [];
    if (profile.id === lastUsedProfileId) {
      markers.push('recent');
    }

    return markers.length > 0 ? `${profile.name} (${markers.join(', ')})` : profile.name;
  }

  private describeProfile(profile: Profile): string {
    const pairs = Object.entries(profile.env).map(([key, value]) => `${key}=${maskEnvValue(key, value)}`);
    return pairs.length > 0 ? pairs.join('\n') : 'No ENV';
  }
}
