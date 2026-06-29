import { promises as fs } from 'node:fs';
import path from 'node:path';
import { applyEdits, modify, parse, type JSONPath } from 'jsonc-parser';
import { getClaudeSettingsPath } from '../utils/paths.js';
import { CliError } from '../utils/errors.js';

export interface SettingsEdit {
  path: JSONPath;
  value: unknown; // undefined means delete
}

export class ClaudeSettingsRepository {
  constructor(private readonly filePath = getClaudeSettingsPath()) {}

  getPath(): string {
    return this.filePath;
  }

  async readEnv(): Promise<Record<string, string>> {
    const text = await this.readFileOrEmpty();
    if (!text.trim()) {
      return {};
    }
    const errors: unknown[] = [];
    const parsed = parse(text, errors as never, { allowTrailingComma: true });
    const env = parsed && typeof parsed === 'object' ? (parsed.env as Record<string, string> | undefined) : undefined;
    return env ?? {};
  }

  async applyEdits(edits: SettingsEdit[]): Promise<void> {
    if (edits.length === 0) {
      return;
    }

    let text = await this.readFileOrEmpty();
    if (!text.trim()) {
      text = '{}\n';
    }

    for (const edit of edits) {
      const patch = modify(text, edit.path, edit.value, {
        formattingOptions: { insertSpaces: true, tabSize: 2 },
      });
      text = applyEdits(text, patch);
    }

    await this.atomicWrite(text);
  }

  private async readFileOrEmpty(): Promise<string> {
    try {
      return await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return '';
      }
      throw new CliError(`Failed to read ${this.filePath}: ${(error as Error).message}`);
    }
  }

  private async atomicWrite(content: string): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, content, 'utf8');
    await fs.rename(tmp, this.filePath);
  }
}
