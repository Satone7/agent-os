# Technical Design: Agent-OS Multi-Agent Collaboration Scheduler

**Branch**: `001-agent-scheduler` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-agent-scheduler/spec.md`

## Summary

Agent-OS is a flow-driven multi-agent collaboration platform where a custom orchestrator (main agent) manages the lifecycle of sub-agents spawned as Claude CLI subprocesses. The system matches user requests to predefined workflows (flows), executes phases sequentially, monitors sub-agent health via time-slice polling, and provides automatic error recovery with user intervention capabilities.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20.x LTS
**Primary Dependencies**: Commander.js (CLI), Inquirer.js (interactive UI), chokidar (file watching), js-yaml (config parsing), pino (logging), zod (validation)
**Storage**: File-based (JSON/Markdown) - no database required
**Testing**: Vitest for unit/integration tests
**Target Platform**: Linux/macOS/Windows CLI
**Project Type**: Single project (CLI tool)
**Performance Goals**: <30s session start, <5s resume, <2s user intervention response
**Constraints**: Single-user local tool, depends on Claude CLI being installed
**Scale/Scope**: 5 concurrent sessions, extensible flow library

## Ground-rules Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| Modularity First | ✅ PASS | Clear module separation: scheduler, agent runtime, flow engine, CLI |
| CLI Interface | ✅ PASS | All functionality exposed via CLI commands (start, resume, stop, list, status) |
| Test-First Development | ✅ PASS | Vitest configured, TDD workflow to be enforced |
| Clear Documentation | ✅ PASS | Spec complete, design docs generated, quickstart planned |
| Simplicity | ✅ PASS | Sequential phases (MVP), file-based storage, single-user model |

**No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-scheduler/
├── design.md            # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal interfaces)
└── tasks.md             # Phase 2 output (/rainbow.taskify command)
```

### Source Code (repository root)

```text
src/
├── cli/                    # CLI entry point and commands
│   ├── index.ts            # Main CLI entry
│   └── commands/           # Subcommand handlers
│       ├── start.ts
│       ├── resume.ts
│       ├── stop.ts
│       ├── list.ts
│       ├── status.ts
│       └── flow.ts
│
├── scheduler/              # Core orchestration
│   ├── session-manager.ts  # Session lifecycle management
│   ├── monitor.ts          # Time-slice monitoring
│   └── spawner.ts          # Sub-agent process management
│
├── agent/                  # Agent runtime components
│   ├── controller.ts       # Main orchestrator logic
│   ├── flow-matcher.ts     # Request-to-flow matching
│   ├── state-serializer.ts # State persistence
│   └── diagnostician.ts    # Sub-agent status diagnosis
│
├── flow/                   # Flow engine
│   ├── loader.ts           # YAML flow loading
│   ├── executor.ts         # Phase execution
│   ├── validator.ts        # Schema validation
│   └── types.ts            # Type definitions
│
├── workspace/              # Workspace management
│   ├── manager.ts          # Create/cleanup/isolate
│   └── retention.ts        # Auto-cleanup policy
│
├── logging/                # Observability
│   └── logger.ts           # Pino-based structured logging
│
└── types/                  # Shared type definitions
    ├── session.ts
    ├── flow.ts
    ├── phase.ts
    └── errors.ts

tests/
├── unit/                   # Unit tests (co-located with src mirrors)
├── integration/            # Integration tests
│   ├── session-lifecycle.test.ts
│   ├── flow-execution.test.ts
│   └── error-recovery.test.ts
└── fixtures/               # Test fixtures
    └── flows/              # Sample flow YAMLs

flows/                      # Built-in flow definitions
├── software-development.yaml
└── research-report.yaml

prompts/                    # Prompt templates for sub-agents
├── sub-agent/
│   ├── requirement.md
│   ├── architecture.md
│   ├── implementation.md
│   ├── testing.md
│   └── review.md
└── recovery/
    ├── loop-break.md
    └── timeout-guidance.md
```

**Structure Decision**: Single project CLI tool. All code lives under `src/` with clear module boundaries. Flows and prompts are configuration data, not source code, stored at repository root.

## Complexity Tracking

No complexity violations to justify. Design adheres to all ground-rules principles.