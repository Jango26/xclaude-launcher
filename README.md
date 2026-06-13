# xClaude Launcher

[English](./README.md) | [中文](./README.zh-CN.md)

`xclaude` solves the problem of switching Claude Code between multiple environment sources.

If you work with more than one Claude setup, such as:

- the default official Claude service
- a proxy or gateway endpoint
- different API base URLs for work and personal use
- different model defaults for different tasks
- different auth tokens across environments

then repeatedly exporting environment variables by hand is tedious and error-prone.

`xclaude` lets you save each setup as a reusable profile, then launch `claude` with the right environment in one step.

## Install

```bash
npm install -g xclaude-launcher
```

## Prerequisites

`xclaude` launches the local `claude` command, so Claude Code must already be installed and available in your `PATH`.

## QuickStart

```bash
# 1. Add your first profile
xclaude config add
```

When creating a profile, you will be prompted for:

- `Profile name`: the label shown in the launcher
- `ANTHROPIC_AUTH_TOKEN`: your Claude auth token
- `ANTHROPIC_BASE_URL`: optional custom API base URL
- `ANTHROPIC_MODEL`: optional default model
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`: optional Haiku override
- `ANTHROPIC_DEFAULT_SONNET_MODEL`: optional Sonnet override
- `ANTHROPIC_DEFAULT_OPUS_MODEL`: optional Opus override
- `CLAUDE_CODE_SUBAGENT_MODEL`: optional subagent model override
- Additional custom ENV vars if needed

You can leave optional fields empty and only set the values you actually use.

```bash
# 2. Launch with the interactive picker
xclaude

# 3. Or launch a specific profile directly
xclaude --profile my-profile
```

If you have not created any profiles yet, start with `xclaude config add`.

## Usage

```bash
xclaude
xclaude --profile my-profile
xclaude config
xclaude config global-env
xclaude config path
```

## What it does

- `xclaude` opens an interactive profile picker and launches `claude` with the selected profile environment.
- `xclaude config` opens the interactive profile manager. The top-level menu provides:
  - `List profiles` — pick a profile and then choose `View` / `Edit` / `Remove`. `View` prints the profile's environment variables one entry per block (key on one line, value on the next) so it stays readable on narrow terminals.
  - `Add profile` — create a new profile.
  - `Edit profile` — pick a profile and edit it directly.
  - `Manage global ENV` — manage environment variables shared by every profile. The submenu provides `View` / `Add` / `Edit` / `Remove`.
  - `Show config path` — print the absolute path of the config file.

## Global ENV

Global ENV is a set of environment variables shared by every profile. At launch they are merged in the order `process.env → globalEnv → profile.env`, so a profile-level key always wins over a global one with the same name.

Use it for things that should apply across all profiles — proxies, telemetry switches, sandbox flags, etc. There are no built-in keys or defaults; every entry is one you add yourself.

## Config file

Profiles are stored in:

```text
~/.xclaude-launcher/config.json
```

## Built-in environment variables

`xclaude config` prompts for these first-class variables:

- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

You can also add any number of custom environment variables to each profile.

## Development

```bash
npm install
npm run build
npm run start -- --help
```

## Links

- Repository: https://github.com/Jango26/xclaude-launcher
- Issues: https://github.com/Jango26/xclaude-launcher/issues
