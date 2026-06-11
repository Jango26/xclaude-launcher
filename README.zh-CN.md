# Claude Launcher

[English](./README.md) | [中文](./README.zh-CN.md)

`xclaude` 用来解决 Claude Code 在多个环境源之间切换麻烦的问题。

如果你平时会在多个 Claude 配置之间来回切换，比如：

- 官方默认 Claude 服务
- 公司或团队内部代理 / 网关
- 不同的 `ANTHROPIC_BASE_URL`
- 不同环境下使用不同的 token
- 不同场景下使用不同的默认模型

那么每次手动切换环境变量会很繁琐，也很容易出错。

`xclaude` 可以把这些配置保存成可复用的 profile，然后在启动 `claude` 时一键带上对应环境变量。

## 安装

```bash
npm install -g xclaude-launcher
```

## 前置要求

`xclaude` 本身不会替代 Claude Code，它只是负责按指定 profile 启动本地的 `claude` 命令。

所以在使用前，需要先确保：

- 已经安装 Claude Code
- `claude` 命令已经在你的 `PATH` 中可用

## QuickStart

```bash
# 1. 新增第一个 profile
xclaude config add
```

创建 profile 时，会依次提示你填写这些信息：

- `Profile name`：这个 profile 在启动器里的显示名称
- `ANTHROPIC_AUTH_TOKEN`：你的 Claude 鉴权 token
- `ANTHROPIC_BASE_URL`：可选，自定义 API 地址
- `ANTHROPIC_MODEL`：可选，默认模型
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`：可选，Haiku 默认模型覆盖
- `ANTHROPIC_DEFAULT_SONNET_MODEL`：可选，Sonnet 默认模型覆盖
- `ANTHROPIC_DEFAULT_OPUS_MODEL`：可选，Opus 默认模型覆盖
- `CLAUDE_CODE_SUBAGENT_MODEL`：可选，subagent 默认模型覆盖
- 其他自定义 ENV 变量：按需添加

如果某些字段你暂时不需要，可以直接留空。

```bash
# 2. 使用交互方式选择 profile 并启动
xclaude

# 3. 或者直接指定 profile 启动
xclaude --profile my-profile
```

如果你还没有创建任何 profile，建议先执行：

```bash
xclaude config add
```

## 用法

```bash
xclaude
xclaude --profile my-profile
xclaude --list
xclaude config
xclaude config path
```

## 这个工具会做什么

- `xclaude` 会打开一个交互式 profile 选择器，并使用所选 profile 的环境变量启动 `claude`
- `xclaude config` 会打开交互式 profile 管理界面

## 配置文件位置

profile 保存在：

```text
~/.claude-launcher/config.json
```

## 内置支持的环境变量

执行 `xclaude config` 时，会优先提示这些一等字段：

- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

除此之外，你也可以为每个 profile 添加任意数量的自定义环境变量。

## 开发

```bash
npm install
npm run build
npm run start -- --help
```

## 链接

- Repository: https://github.com/placeholder/xclaude
- Issues: https://github.com/placeholder/xclaude/issues
