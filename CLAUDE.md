# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repository is a small TypeScript-based Node.js CLI. Its compiled entrypoint is `dist/index.js`, and `package.json` exposes it as the `xclaude` binary.

The CLI currently has two main responsibilities:
- `xclaude`: select a stored profile, then start the real `claude` command with that profile's environment variables.
- `xclaude config`: manage profiles interactively, including listing, adding, editing, removing them, and showing the config file path.

## Common commands

### Install dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run dev
```

`npm run dev` only runs the TypeScript compiler in watch mode. It does not execute the built CLI.

### Run the CLI
Build first:
```bash
npm run build
```

Then run commands like:
```bash
npm run start -- --help
npm run start -- --list
npm run start -- --profile my-profile --verbose
npm run start -- config
npm run start -- config path
```

For quick validation without building first:
```bash
npx tsx src/index.ts --help
npx tsx src/index.ts --list
npx tsx src/index.ts --profile my-profile --verbose
npx tsx src/index.ts config list
npx tsx src/index.ts config path
```

### Capabilities not configured in this repo
- There is no `lint` script.
- There is no test runner and no `test` script.
- There is therefore no existing command for running a single test; a test toolchain would need to be added first.

## Architecture

### Entry point and command routing
- `src/index.ts` is the only CLI entrypoint.
- It performs lightweight argument parsing and dispatches to command modules.
- Current commands:
  - root command → `src/commands/run-claude.ts`
  - `config` → `src/commands/config.ts`

When adding a new command, update `src/index.ts` first, then add a corresponding `src/commands/*` module.

### Layering
The codebase is small but intentionally split into command, service, adapter, and utility layers:

- `src/commands/*`: CLI-facing orchestration.
- `src/services/*`: core behavior.
  - `ConfigService` owns profile CRUD and last-used state.
  - `PromptService` owns all Inquirer prompts and terminal-facing summaries.
  - `ClaudeLauncherService` turns a profile into an actual `claude` process launch.
- `src/adapters/*`: filesystem and process boundaries.
  - `FileConfigRepository` reads and writes the local JSON config file.
  - `ProcessRunner` wraps `spawn()`.
- `src/utils/*`: shared path/env/error helpers.
- `src/models/config.ts`: shared config types used across layers.

If behavior changes span prompts, persistence, and launch behavior, keep the change split along these boundaries instead of pushing everything into a command module.

### Config persistence and data flow
Profiles are stored in `~/.claude-launcher/config.json`. The exact location is centralized in `src/utils/paths.ts`.

Flow:
1. `run-claude` or `config` creates a `ConfigService`.
2. `ConfigService` loads or saves config through `FileConfigRepository`.
3. The config contract is defined in `src/models/config.ts`.
4. `run-claude` resolves the profile, records it as last used, then launches `claude`.

If you change the shape of profile input or stored config, inspect all of these together:
- `src/models/config.ts`
- `src/adapters/file-config-repo.ts`
- `src/services/config-service.ts`
- `src/services/prompt-service.ts`
- `src/utils/env.ts`

### Profile semantics
A profile represents one `claude` launch configuration:
- `id` / `name`
- command to execute (currently fixed to `claude`)
- base args stored on the profile (currently `[]`)
- environment variables injected at launch time

`Profile.command` and `Profile.args` exist in the data model, but `ConfigService` currently creates profiles with:
- `command: 'claude'`
- `args: []`

That means the meaningful user-configurable surface today is the environment block, not arbitrary command templates.

### Environment variable conventions
`src/utils/env.ts` is the single place for profile env handling:
- `buildProfileEnv()` maps prompt input into the stored env object.
- `mergeEnv()` overlays profile env values onto `process.env` for child process launch.
- `validateEnvKey()` enforces all-uppercase shell-style names for custom env vars.

The interactive config flow collects these first-class env vars explicitly:
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

All env values are displayed in profile listings and edit prompts. Launch selection currently shows profile names only, and other profile displays use masked values rather than raw plaintext.

If a new env var should be treated as a first-class field in the prompt flow, add it consistently in both `PromptProfileInput` and `buildProfileEnv()`.

### Interactive config flow
`src/commands/config.ts` and `src/services/prompt-service.ts` together define the config UX:
- `config list` is not just a dump; it supports drilling into a selected profile and then editing or removing it.
- `config add` and `config edit` reuse the same `promptProfileInput()` flow.
- The top-level config menu includes a config-path view, and submenus consistently provide `Back` / `Exit` navigation.
- First-class env vars are prompted explicitly.
- Any remaining env keys are handled through the custom ENV loop.

If you change config UX, inspect both the command flow and the prompt implementation.

### Claude launch flow
`src/commands/run-claude.ts` currently works like this:
1. Load config.
2. If `--list` is present, print profiles and exit.
3. Otherwise resolve the profile in this priority order:
   - `--profile`
   - interactive selection
4. Mark the profile as last used.
5. Lazily import `ClaudeLauncherService` and spawn `claude`.

`xclaude` recognizes `--profile` and `--list` as launcher-specific flags. Any other trailing arguments are forwarded directly to the real `claude` process.

Example:
```bash
xclaude --profile prod --verbose --dangerously-skip-permissions
```

In that case, `--verbose --dangerously-skip-permissions` are passed through to `claude`.

`ClaudeLauncherService` also translates `ENOENT` into a user-facing error when the `claude` binary is not available in `PATH`.

## Implementation notes

- The project uses ESM. `package.json` sets `type: module`, and TypeScript uses `module` / `moduleResolution: NodeNext`. Keep `.js` extensions in local imports.
- Argument parsing in `src/index.ts` is intentionally lightweight and manual. Preserve that style unless command complexity clearly justifies a parser library.
- With no lint or test scripts, the minimum validation for changes is `npm run build`, plus manual command checks through `npx tsx src/index.ts ...` or `npm run start -- ...`.
