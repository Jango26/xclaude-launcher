import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { ConfigFile } from '../models/config.js';
import { CliError } from '../utils/errors.js';
import { getConfigDir, getConfigPath, getLegacyConfigPath } from '../utils/paths.js';

const DEFAULT_CONFIG: ConfigFile = {
  version: 1,
  profiles: [],
  globalEnv: {},
};

export class FileConfigRepository {
  async load(): Promise<ConfigFile> {
    const filePath = getConfigPath();

    try {
      const content = await readFile(filePath, 'utf8');
      return this.parseConfig(content, filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new CliError(`Failed to read config: ${filePath}`);
      }
    }

    const legacyFilePath = getLegacyConfigPath();

    try {
      const legacyContent = await readFile(legacyFilePath, 'utf8');
      const config = this.parseConfig(legacyContent, legacyFilePath);
      await this.save(config);
      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return structuredClone(DEFAULT_CONFIG);
      }

      throw new CliError(`Failed to read config: ${legacyFilePath}`);
    }
  }

  async save(config: ConfigFile): Promise<void> {
    await mkdir(getConfigDir(), { recursive: true });
    await writeFile(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }

  private parseConfig(content: string, filePath: string): ConfigFile {
    try {
      const parsed = JSON.parse(content) as ConfigFile;
      return {
        version: parsed.version ?? 1,
        profiles: parsed.profiles ?? [],
        lastUsedProfileId: parsed.lastUsedProfileId,
        globalEnv: parsed.globalEnv ?? {},
      };
    } catch {
      throw new CliError(`Failed to read config: ${filePath}`);
    }
  }
}
