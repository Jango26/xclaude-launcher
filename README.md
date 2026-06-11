# Claude Launcher

Launch Claude Code with reusable environment profiles.

## Install

```bash
npm install -g xclaude
```

## Prerequisites

`xclaude` launches the local `claude` command, so Claude Code must already be installed and available in your `PATH`.

## Usage

```bash
xclaude
xclaude --profile my-profile
xclaude --list
xclaude config
xclaude config path
```

## What it does

- `xclaude` opens an interactive profile picker and launches `claude` with the selected profile environment.
- `xclaude config` opens the interactive profile manager.

## Config file

Profiles are stored in:

```text
~/.claude-launcher/config.json
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

- Repository: https://github.com/placeholder/xclaude
- Issues: https://github.com/placeholder/xclaude/issues
