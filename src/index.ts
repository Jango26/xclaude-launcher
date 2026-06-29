#!/usr/bin/env node
import { createRequire } from 'node:module';
import { runClaudeCommand } from './commands/run-claude.js';
import { runConfigCommand } from './commands/config.js';
import { runApplyCommand, type ApplyOptions } from './commands/apply.js';
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
    if (rest[0] === '-h' || rest[0] === '--help') {
      printConfigHelp();
      return;
    }
    const code = await runConfigCommand(rest[0]);
    process.exitCode = code;
    return;
  }

  if (command === 'apply') {
    if (rest.includes('-h') || rest.includes('--help')) {
      printApplyHelp();
      return;
    }
    const code = await runApplyCommand(parseApplyOptions(rest));
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

function parseApplyOptions(args: string[]): ApplyOptions {
  const options: ApplyOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === '--clear') {
      options.clear = true;
      continue;
    }

    if (current === '--show') {
      options.show = true;
      continue;
    }

    if (current === '--profile') {
      const value = args[index + 1];
      if (!value) {
        throw new CliError('--profile requires a value');
      }
      options.profile = value;
      index += 1;
      continue;
    }

    if (current.startsWith('-')) {
      throw new CliError(`Unknown apply option: ${current}`);
    }

    if (options.profile) {
      throw new CliError(`Unexpected argument: ${current}`);
    }
    options.profile = current;
  }

  return options;
}

function printHelp(): void {
  console.log(`xclaude - Launch Claude Code with reusable env profiles (v${pkg.version})

Usage:
  xclaude [options] [-- claude args...]
  xclaude <command> [options]

Commands:
  config              Manage profiles and global ENV (interactive menu)
  apply               Write profile env into ~/.claude/settings.json
  (default)           Launch \`claude\` using a selected profile

Options (default launch):
  --profile <name>    Use the named profile (skip interactive picker)
  --list              List profiles and exit (do not launch)
  -h, --help          Show this help
  -v, --version       Show version

Any unknown args are forwarded to the \`claude\` process.

Examples:
  xclaude                                  # pick a profile interactively, then launch
  xclaude --list                           # show profiles, do not launch
  xclaude --profile prod                   # launch with profile "prod"
  xclaude --profile prod --verbose         # forward --verbose to claude
  xclaude config                           # open config menu
  xclaude config add                       # add a new profile
  xclaude apply prod                       # sync profile "prod" into ~/.claude/settings.json
  xclaude apply --show                     # show managed env currently in settings.json
  xclaude apply --clear                    # clear managed env from settings.json

Files:
  ~/.xclaude-launcher/config.json          # profile store (managed by this CLI)
  ~/.claude/settings.json                  # written by \`xclaude apply\` (managed keys only)

See also:
  xclaude config --help
  xclaude apply --help
`);
}

function printConfigHelp(): void {
  console.log(`xclaude config - Manage profiles and global ENV

Usage:
  xclaude config                Open interactive menu
  xclaude config <action>

Actions:
  list                List profiles, drill into one to view/edit/remove
  add                 Add a new profile
  edit                Choose a profile and edit it
  global-env          Manage global ENV shared by all profiles
  path                Print the config file path

Options:
  -h, --help          Show this help

When prompted for profile ENV, these are required:
  ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL

These are optional:
  ANTHROPIC_DEFAULT_HAIKU_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL,
  ANTHROPIC_DEFAULT_OPUS_MODEL, CLAUDE_CODE_SUBAGENT_MODEL

You may also add any number of custom uppercase ENV keys.

File:
  ~/.xclaude-launcher/config.json
`);
}

function printApplyHelp(): void {
  console.log(`xclaude apply - Write profile env into ~/.claude/settings.json

Usage:
  xclaude apply                       Pick a profile interactively, then write
  xclaude apply <profile>             Write the named profile
  xclaude apply --profile <name>      Same as above
  xclaude apply --show                Show managed env currently in settings.json
  xclaude apply --clear               Remove managed env from settings.json

Options:
  --profile <name>    Profile name or id
  --show              Read-only: print managed keys currently in settings.json
  --clear             Remove the 7 managed keys from settings.json
  -h, --help          Show this help

Behavior:
  - Only these 7 managed keys are touched; everything else is preserved:
      ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL,
      ANTHROPIC_DEFAULT_HAIKU_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL,
      ANTHROPIC_DEFAULT_OPUS_MODEL, CLAUDE_CODE_SUBAGENT_MODEL
  - Profile's custom (extra) ENV is NOT written to settings.json.
    Use the default \`xclaude\` launcher if you need them injected at runtime.
  - Edits are minimal (jsonc-parser): your indentation, comments, and key
    order in settings.json are preserved. Writes are atomic (temp + rename).
  - Keys present in the profile are written; managed keys absent from the
    profile but present in settings.json are removed (so switching profiles
    leaves no residue).

Note:
  \`xclaude apply\` changes a persistent file used by every \`claude\` launch.
  The default \`xclaude\` command only injects env into the child process it
  spawns and does not modify settings.json.

Files:
  ~/.claude/settings.json
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  process.exitCode = 1;
});
