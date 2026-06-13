import { ConfigService } from '../services/config-service.js';
import { PromptService } from '../services/prompt-service.js';
import { getConfigPath } from '../utils/paths.js';
import { CliError } from '../utils/errors.js';

export async function runConfigCommand(action?: string): Promise<number> {
  const configService = new ConfigService();
  const promptService = new PromptService();

  while (true) {
    const fromArg = action !== undefined;
    const nextAction = normalizeAction(action) ?? (await promptService.chooseConfigAction());
    action = undefined;

    if (nextAction === 'path') {
      console.log(getConfigPath());
      if (fromArg) {
        return 0;
      }
      continue;
    }

    if (nextAction === 'exit') {
      return 0;
    }

    if (nextAction === 'global-env') {
      let leave = false;
      while (!leave) {
        const env = await configService.getGlobalEnv();
        const action = await promptService.chooseGlobalEnvAction();
        if (action === 'exit') {
          return 0;
        }
        if (action === 'back') {
          leave = true;
          break;
        }
        if (action === 'view') {
          promptService.printGlobalEnv(env);
          continue;
        }
        if (action === 'add') {
          const { key, value } = await promptService.promptGlobalEnvEntry();
          const next = { ...env, [key]: value };
          await configService.setGlobalEnv(next);
          console.log(`Added ${key}`);
          continue;
        }
        if (action === 'edit') {
          const key = await promptService.chooseGlobalEnvKey(env, 'Choose an ENV to edit');
          if (key === 'back') {
            console.log('No ENV to edit');
            continue;
          }
          const updated = await promptService.promptGlobalEnvEntry(key, env[key]);
          const next = { ...env };
          if (updated.key !== key) {
            delete next[key];
          }
          next[updated.key] = updated.value;
          await configService.setGlobalEnv(next);
          console.log(`Updated ${updated.key}`);
          continue;
        }
        if (action === 'remove') {
          const key = await promptService.chooseGlobalEnvKey(env, 'Choose an ENV to remove');
          if (key === 'back') {
            console.log('No ENV to remove');
            continue;
          }
          if (await promptService.confirmRemoveGlobalEnv(key)) {
            const next = { ...env };
            delete next[key];
            await configService.setGlobalEnv(next);
            console.log(`Removed ${key}`);
          }
          continue;
        }
      }

      if (fromArg) {
        return 0;
      }
      continue;
    }

    if (nextAction === 'list') {
      while (true) {
        const config = await configService.getConfig();

        if (config.profiles.length === 0) {
          console.log('No profiles');
          break;
        }

        const profile = await promptService.chooseProfileOrBackOrExit(config.profiles, config.lastUsedProfileId);
        if (profile === 'exit') {
          return 0;
        }
        if (profile === 'back') {
          break;
        }

        let backToProfiles = false;
        while (!backToProfiles) {
          const profileAction = await promptService.chooseProfileAction();
          if (profileAction === 'exit') {
            return 0;
          }
          if (profileAction === 'back') {
            backToProfiles = true;
            break;
          }

          if (profileAction === 'view') {
            promptService.printProfileEnv(profile);
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
            backToProfiles = true;
            break;
          }
        }
      }

      if (fromArg) {
        return 0;
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

      if (fromArg) {
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

      if (fromArg) {
        return 0;
      }
      continue;
    }

    throw new CliError(`Unsupported config action: ${action}`);
  }
}

function normalizeAction(
  action?: string,
): 'list' | 'add' | 'edit' | 'global-env' | 'path' | undefined {
  if (!action) {
    return undefined;
  }

  if (
    action === 'list' ||
    action === 'add' ||
    action === 'edit' ||
    action === 'global-env' ||
    action === 'path'
  ) {
    return action;
  }

  throw new CliError(`Unsupported config action: ${action}`);
}
