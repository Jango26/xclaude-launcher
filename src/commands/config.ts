import { ConfigService } from '../services/config-service.js';
import { PromptService } from '../services/prompt-service.js';
import { getConfigPath } from '../utils/paths.js';
import { CliError } from '../utils/errors.js';

export async function runConfigCommand(action?: string): Promise<number> {
  const configService = new ConfigService();
  const promptService = new PromptService();

  while (true) {
    const nextAction = normalizeAction(action) ?? (await promptService.chooseConfigAction());
    action = undefined;

    if (nextAction === 'path') {
      console.log(getConfigPath());
      continue;
    }

    if (nextAction === 'exit') {
      return 0;
    }

    if (nextAction === 'list') {
      while (true) {
        const config = await configService.getConfig();
        promptService.printProfiles(config.profiles, config.lastUsedProfileId);

        if (config.profiles.length === 0) {
          break;
        }

        const profile = await promptService.chooseProfileOrBackOrExit(config.profiles, config.lastUsedProfileId);
        if (profile === 'exit') {
          return 0;
        }
        if (profile === 'back') {
          break;
        }

        const profileAction = await promptService.chooseProfileAction();
        if (profileAction === 'exit') {
          return 0;
        }
        if (profileAction === 'back') {
          continue;
        }

        if (profileAction === 'edit') {
          const input = await promptService.promptProfileInput(profile);
          if (input === 'exit') {
            return 0;
          }
          if (input === 'back') {
            continue;
          }

          const updated = await configService.updateProfile(profile.id, input);
          console.log(`Updated profile: ${updated.name}`);
          continue;
        }

        if (await promptService.confirmRemoveProfile(profile)) {
          const removed = await configService.removeProfile(profile.id);
          console.log(`Removed profile: ${removed.name}`);
        }
      }

      continue;
    }

    if (nextAction === 'add') {
      while (true) {
        const input = await promptService.promptProfileInput();
        if (input === 'exit') {
          return 0;
        }
        if (input === 'back') {
          break;
        }

        const profile = await configService.addProfile(input);
        console.log(`Added profile: ${profile.name}`);
        return 0;
      }

      continue;
    }

    if (nextAction === 'edit') {
      while (true) {
        const config = await configService.getConfig();
        const profile = await promptService.chooseProfileOrBackOrExit(config.profiles, config.lastUsedProfileId);
        if (profile === 'exit') {
          return 0;
        }
        if (profile === 'back') {
          break;
        }

        const input = await promptService.promptProfileInput(profile);
        if (input === 'exit') {
          return 0;
        }
        if (input === 'back') {
          continue;
        }

        const updated = await configService.updateProfile(profile.id, input);
        console.log(`Updated profile: ${updated.name}`);
        continue;
      }

      continue;
    }

    throw new CliError(`Unsupported config action: ${action}`);
  }
}

function normalizeAction(action?: string): 'list' | 'add' | 'edit' | 'path' | undefined {
  if (!action) {
    return undefined;
  }

  if (action === 'list' || action === 'add' || action === 'edit' || action === 'path') {
    return action;
  }

  throw new CliError(`Unsupported config action: ${action}`);
}
