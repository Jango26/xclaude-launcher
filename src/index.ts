#!/usr/bin/env node
import { createRequire } from 'node:module';
import { runClaudeCommand } from './commands/run-claude.js';
import { runConfigCommand } from './commands/config.js';
import { CliError } from './utils/errors.js';

const pkg = createRequire(import.meta.url)('../package.json') as { version: string };

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const [command, ...rest] = args;

  if (command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log(pkg.version);
    return;
  }

  if (command === 'config') {
    const code = await runConfigCommand(rest[0]);
    process.exitCode = code;
    return;
  }

  const code = await runClaudeCommand(parseRunClaudeOptions(args));
  process.exitCode = code;
}

function parseRunClaudeOptions(args: string[]): { profile?: string; list?: boolean; claudeArgs: string[] } {
  const options: { profile?: string; list?: boolean; claudeArgs: string[] } = {
    claudeArgs: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === '--profile') {
      const value = args[index + 1];
      if (!value) {
        throw new CliError('--profile requires a value');
      }
      options.profile = value;
      index += 1;
      continue;
    }

    if (current === '--list') {
      options.list = true;
      continue;
    }

    options.claudeArgs.push(current);
  }

  return options;
}

function printHelp(): void {
  console.log(`xclaude - xClaude Launcher v${pkg.version}\n\nUsage:\n  xclaude [claude args...]\n  xclaude config [list|add|edit|global-env|path]\n  xclaude --version\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  process.exitCode = 1;
});
