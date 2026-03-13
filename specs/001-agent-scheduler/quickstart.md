# Agent-OS Quick Start Guide

**Feature**: 001-agent-scheduler
**Date**: 2026-03-13

## Prerequisites

- **Node.js** 20.x or later
- **pnpm** 8.x or later
- **Claude CLI** installed and authenticated

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Install globally (optional)
pnpm link --global
```

## First Run

### 1. Verify Claude CLI

```bash
claude --version
```

If not installed, follow the Claude CLI installation instructions.

### 2. Start a New Session

```bash
agent-os start
```

You'll be greeted with an interactive prompt:

```
🚀 Agent-OS v1.0.0
Session: abc-123

你好！我是 Agent-OS 的主调度 Agent。
请告诉我你想做什么？

>
```

### 3. Describe Your Task

```
> I want to develop a todo app
```

The system will match your request to an appropriate flow:

```
我理解你想开发一个待办事项应用。让我匹配一下流程...

✅ 匹配到流程：软件开发流程

这个流程包含以下阶段：
1. 需求分析 - 理解你的具体需求
2. 架构设计 - 设计技术方案
3. 编码实现 - 编写代码
4. 测试验证 - 确保质量
5. 代码审查 - 最终检查

预计总时长：约 1-2 小时

是否开始？[Y/n]
```

### 4. Monitor Progress

During execution, press **Enter** to see status:

```
当前阶段：需求分析
运行时间：5m 23s
状态：正常运行中

最近活动（子 Agent）：
- 正在分析用户故事...
- 已识别 3 个核心功能
- 正在编写需求文档...

可用命令：
/status   - 查看详细状态
/pause    - 暂停当前阶段
/skip     - 跳过当前阶段
/input    - 向子 Agent 提供输入
/continue - 继续等待
```

### 5. Provide Input

Send feedback to the running sub-agent:

```
> /input 需要支持数据导出功能

✅ 已将你的输入传递给子 Agent
子 Agent 将在下一个时间片处理你的反馈
```

### 6. Handle Errors

If a sub-agent gets stuck, you'll be asked to help:

```
⚠️ 需要你的帮助

架构设计阶段遇到了一些困难（已重试 3 次）：

问题：需求文档中对于"数据同步"的描述不够清晰，
无法确定是实时同步还是定时同步。

请选择：
[1] 实时同步 - 数据变化立即同步
[2] 定时同步 - 每隔一段时间同步
[3] 不需要同步 - 单机应用即可
[4] 自定义回复...

> 1
```

## Common Commands

### Session Management

```bash
# Start new session
agent-os start

# Start with specific flow
agent-os start --flow software-development

# Resume last session
agent-os resume --last

# Resume specific session
agent-os resume abc-123

# List all sessions
agent-os list

# Check session status
agent-os status
agent-os status abc-123

# Stop session
agent-os stop
agent-os stop abc-123
```

### Flow Management

```bash
# List available flows
agent-os flow list

# Show flow details
agent-os flow show software-development
```

### Interactive Commands (during session)

| Command | Description |
|---------|-------------|
| `/status` | Show detailed session status |
| `/pause` | Pause current phase |
| `/resume` | Resume paused phase |
| `/skip` | Skip current phase |
| `/input <text>` | Send input to sub-agent |
| `/log` | View recent logs |
| `/stop` | End session |
| `/help` | Show available commands |

## Configuration

### Global Config

Location: `~/.agent-os/config.yaml`

```yaml
# Default model for all agents
default:
  model: claude-sonnet-4-6

# Workspace settings
workspace:
  root: ~/.agent-os/workspaces
  cleanup_after_days: 7

# Claude CLI settings
claude:
  path: claude
  default_timeout: 30m

# Logging
logging:
  level: info
  file: ~/.agent-os/logs/agent-os.log

# Flow paths
flows:
  paths:
    - ~/.agent-os/flows
    - ./flows
```

### Project Config

Location: `.agent-os.yaml` (in project root)

```yaml
project: my-project

# Override default model
default:
  model: claude-opus-4-6

# Add custom flow paths
flows:
  paths:
    - ./custom-flows

# Override phase settings
phases:
  implementation:
    time_slice:
      default: 20m
```

## Creating Custom Flows

Create a YAML file in any configured flow path:

```yaml
# flows/my-workflow.yaml
id: my-workflow
name: My Custom Workflow
version: 1.0.0
description: A custom workflow for my needs

trigger:
  keywords:
    - mytask
    - custom
  patterns:
    - "帮我完成(我的)?任务"

phases:
  - id: setup
    name: Setup
    description: Initialize the environment
    agent:
      prompt_template: prompts/my-workflow/setup.md
    time_slice:
      default: 5m
    outputs:
      - workspace/setup-complete
    config:
      max_retries: 2
      allow_skip: false

  - id: execute
    name: Execute
    description: Run the main task
    agent:
      prompt_template: prompts/my-workflow/execute.md
    time_slice:
      default: 15m
    outputs:
      - workspace/output/**
    config:
      max_retries: 3
      allow_skip: false

settings:
  default_model: claude-sonnet-4-6
  failure_policy:
    max_total_retries: 10
    user_notify_threshold: 3
```

## Troubleshooting

### Claude CLI Not Found

```
Error: Claude CLI not found
Please install Claude CLI: https://docs.anthropic.com/claude-cli
```

Solution: Install Claude CLI and ensure it's in your PATH.

### Session Won't Resume

```bash
# Check session exists
agent-os list

# Check session state
agent-os status <session-id>
```

### Disk Full

```
Error: Disk full - cannot write to workspace
```

Solution:
```bash
# Trigger cleanup
agent-os cleanup

# Or manually delete old workspaces
rm -rf ~/.agent-os/workspaces/session-old-id
```

### Sub-Agent Stuck

The system should auto-detect and recover. If it doesn't:

1. Press Enter to check status
2. Use `/skip` to skip the phase
3. Use `/stop` to end session

## Next Steps

- Read the [design document](./design.md) for architecture details
- Review the [data model](./data-model.md) for entity definitions
- Check [contracts/](./contracts/) for module interfaces
- Run `/rainbow.taskify` to generate implementation tasks