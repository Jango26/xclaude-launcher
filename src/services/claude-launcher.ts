import type { Profile } from '../models/config.js';
import { ProcessRunner } from '../adapters/process-runner.js';
import { mergeEnv } from '../utils/env.js';
import { CliError } from '../utils/errors.js';

export class ClaudeLauncherService {
  constructor(private readonly processRunner = new ProcessRunner()) {}

  async launch(profile: Profile, extraArgs: string[] = [], globalEnv: Profile['env'] = {}): Promise<number> {
    try {
      return await this.processRunner.run(profile.command, [...profile.args, ...extraArgs], mergeEnv(globalEnv, profile.env));
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      if (errno.code === 'ENOENT') {
        throw new CliError('Could not find the claude command. Make sure it is installed and available in PATH');
      }

      throw error;
    }
  }
}
