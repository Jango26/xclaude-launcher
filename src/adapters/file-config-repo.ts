import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { ConfigFile } from '../models/config.js';
import { CliError } from '../utils/errors.js';
import { getConfigDir, getConfigPath } from '../utils/paths.js';

const DEFAULT_CONFIG: ConfigFile = {
  version: 1,
  profiles: [],
};

export class FileConfigRepository {
  async load(): Promise<ConfigFile> {
    const filePath = getConfigPath();

    try {
      const content = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(content) as ConfigFile;
      return {
        version: parsed.version ?? 1,
        profiles: parsed.profiles ?? [],
        lastUsedProfileId: parsed.lastUsedProfileId,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return structuredClone(DEFAULT_CONFIG);
      }

      throw new CliError(`Failed to read config: ${filePath}`);
    }
  }

  async save(config: ConfigFile): Promise<void> {
    await mkdir(getConfigDir(), { recursive: true });
    await writeFile(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
}
