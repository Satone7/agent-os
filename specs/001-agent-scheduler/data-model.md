# Data Model: Agent-OS Multi-Agent Collaboration Scheduler

**Feature**: 001-agent-scheduler
**Date**: 2026-03-13

## Entity Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Session   │──────▶│    Flow     │──────▶│    Phase    │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐                            ┌─────────────┐
│  Workspace  │                            │  SubAgent   │
└─────────────┘                            │  (Process)  │
                                           └─────────────┘
```

---

## Core Entities

### Session

Represents a single execution of a flow. The primary entity for tracking user work.

**File**: `workspace/session.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique session identifier |
| `state` | enum | Yes | Current state: `created`, `running`, `paused`, `completed`, `stopped` |
| `workspacePath` | string | Yes | Absolute path to session workspace |
| `flowId` | string | Yes | Reference to flow definition |
| `flowName` | string | Yes | Human-readable flow name (denormalized) |
| `currentPhaseIndex` | number | Yes | Index of current phase (0-based) |
| `currentPhase` | string | Yes | ID of current phase |
| `phaseStatus` | Record<string, PhaseStatus> | Yes | Status map keyed by phase ID |
| `totalRetries` | number | Yes | Cumulative retry count across all phases |
| `userInterventions` | number | Yes | Count of user intervention events |
| `createdAt` | ISO 8601 string | Yes | Session creation timestamp |
| `updatedAt` | ISO 8601 string | Yes | Last update timestamp |
| `completedAt` | ISO 8601 string | No | Completion timestamp (for retention) |
| `userRequest` | string | Yes | Original user request text |
| `lastCheckTime` | ISO 8601 string | No | Last status check timestamp |
| `nextAction` | string | No | Next action to take (for resume) |
| `nextActionParams` | object | No | Parameters for next action |

**State Transitions**:
```
created → running → completed
              ↓
           paused → running
              ↓
           stopped
```

---

### PhaseStatus

Tracks the status of a single phase within a session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | `pending`, `running`, `completed`, `failed`, `skipped` |
| `startTime` | ISO 8601 string | No | When phase started |
| `endTime` | ISO 8601 string | No | When phase ended |
| `retryCount` | number | Yes | Retry attempts for this phase |
| `grantedTimeSlices` | string[] | Yes | History of granted time slices (e.g., `["10m", "5m"]`) |
| `error` | PhaseError | No | Error details if failed |

---

### PhaseError

Captures error details for failed phases.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | Yes | `startup_failed`, `timeout`, `crash`, `stuck_in_loop`, `blocked`, `output_validation_failed` |
| `message` | string | Yes | Human-readable error description |
| `timestamp` | ISO 8601 string | Yes | When error occurred |
| `severity` | enum | Yes | `minor`, `major`, `critical` |
| `context` | object | No | Additional diagnostic data |

---

### Flow

A predefined workflow template. Loaded from YAML files.

**File**: `flows/*.yaml`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique flow identifier (kebab-case) |
| `name` | string | Yes | Human-readable flow name |
| `version` | string | Yes | Semantic version (e.g., `1.0.0`) |
| `description` | string | Yes | Brief description of the flow |
| `trigger` | FlowTrigger | Yes | Matching conditions |
| `phases` | Phase[] | Yes | Ordered list of phases (sequential) |
| `settings` | FlowSettings | Yes | Flow-level configuration |

---

### FlowTrigger

Conditions for matching user requests to flows.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keywords` | string[] | Yes | Keywords that trigger this flow |
| `patterns` | string[] | No | Regex patterns for matching |

**Matching Priority**:
1. Regex patterns match first (more specific)
2. Keyword matches second
3. Higher version wins on ties

---

### Phase

A single step within a flow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique phase identifier (kebab-case) |
| `name` | string | Yes | Human-readable phase name |
| `description` | string | Yes | Brief description of phase purpose |
| `agent` | AgentConfig | Yes | Sub-agent configuration |
| `timeSlice` | TimeSliceConfig | No | Monitoring interval settings |
| `outputs` | string[] | Yes | Expected output file patterns (glob) |
| `config` | PhaseConfig | Yes | Phase behavior settings |

---

### AgentConfig

Configuration for spawning a sub-agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | No | Model override (defaults to flow setting) |
| `promptTemplate` | string | Yes | Path to prompt template file |
| `skills` | string[] | No | Pre-loaded skills for sub-agent |
| `tools` | string[] | No | Allowed tools (empty = all allowed) |
| `env` | Record<string, string> | No | Environment variables for sub-agent |

---

### TimeSliceConfig

Time-slice monitoring settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `default` | string | Yes | Default check interval (e.g., `10m`, `1h`) |
| `max` | string | No | Maximum runtime before termination |

---

### PhaseConfig

Phase behavior configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `maxRetries` | number | Yes | - | Maximum retry attempts |
| `allowSkip` | boolean | No | `false` | Allow user to skip this phase |
| `requireUserConfirm` | boolean | No | `false` | Require user approval before next phase |

---

### FlowSettings

Flow-level settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `defaultModel` | string | Yes | Default model for all phases |
| `failurePolicy` | FailurePolicy | Yes | Retry and notification settings |

---

### FailurePolicy

Flow-level failure handling.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maxTotalRetries` | number | Yes | Maximum retries across entire flow |
| `userNotifyThreshold` | number | Yes | Notify user after N consecutive failures |

---

### SubAgentProcess

Runtime representation of a spawned sub-agent.

**In-memory only** (not persisted)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique process identifier |
| `pid` | number | Yes | Operating system process ID |
| `phaseId` | string | Yes | Phase this agent is executing |
| `workspacePath` | string | Yes | Path to sub-agent workspace |
| `conversationPath` | string | Yes | Path to Claude conversation file |
| `startTime` | Date | Yes | When process was spawned |
| `timeSliceTimer` | NodeJS.Timeout | Yes | Timer for next check |
| `status` | enum | Yes | `spawning`, `running`, `paused`, `terminated` |

---

### Decision

Records a main agent decision for auditing.

**File**: `workspace/decisions.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 string | Yes | When decision was made |
| `action` | enum | Yes | `start_flow`, `start_next_phase`, `grant_time_slice`, `check_subagent`, `retry_phase`, `skip_phase`, `ask_user`, `complete_flow` |
| `params` | object | No | Action-specific parameters |
| `reason` | string | Yes | Human-readable rationale |

---

### DiagnosticResult

Result of sub-agent status diagnosis.

**In-memory only** (derived from conversation analysis)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | `healthy`, `stuck`, `blocked`, `completed`, `unknown` |
| `confidence` | number | Yes | Confidence score (0-1) |
| `indicators` | string[] | Yes | Evidence supporting diagnosis |
| `recommendation` | string | Yes | Suggested next action |

---

## Configuration Files

### Global Config

**File**: `~/.agent-os/config.yaml`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default.model` | string | `claude-sonnet-4-6` | Default AI model |
| `workspace.root` | string | `~/.agent-os/workspaces` | Workspace root directory |
| `workspace.cleanupAfterDays` | number | `7` | Session retention days |
| `claude.path` | string | `claude` | Claude CLI executable path |
| `claude.defaultTimeout` | string | `30m` | Default timeout for sub-agents |
| `logging.level` | string | `info` | Log level |
| `logging.file` | string | `~/.agent-os/logs/agent-os.log` | Log file path |
| `flows.paths` | string[] | `["~/.agent-os/flows", "./flows"]` | Flow definition directories |

### Project Config

**File**: `.agent-os.yaml` (in project root)

| Field | Type | Description |
|-------|------|-------------|
| `project` | string | Project name |
| `flows.paths` | string[] | Additional flow paths |
| `default.model` | string | Override default model |
| `phases.<id>.timeSlice` | object | Override time slice for specific phase |

---

## Workspace Structure

```
~/.agent-os/
├── config.yaml              # Global configuration
├── logs/
│   └── agent-os.log         # Structured logs
├── workspaces/              # Session workspaces
│   └── session-{id}/
│       ├── main/            # Main agent workspace
│       │   ├── session.json
│       │   ├── user-request.md
│       │   ├── progress.md
│       │   └── decisions.json
│       └── sub-{phase-id}/  # Sub-agent workspaces
│           └── ...          # Phase-specific outputs
└── flows/                   # Built-in flow definitions
    └── *.yaml
```

---

## Validation Rules

### Session ID
- Format: UUID v4
- Generated on session creation
- Immutable

### Phase ID
- Format: kebab-case (lowercase, hyphens)
- Unique within flow
- Example: `requirement-analysis`, `code-implementation`

### Flow ID
- Format: kebab-case
- Unique across all loaded flows
- Must match filename (without `.yaml`)

### Time Slice Duration
- Format: `<number><unit>` where unit is `s`, `m`, `h`
- Examples: `30s`, `10m`, `1h`
- Minimum: `1m`
- Maximum: `24h`

### Model ID
- Must be valid Claude model identifier
- Examples: `claude-sonnet-4-6`, `claude-opus-4-6`