# Research: Agent-OS Multi-Agent Collaboration Scheduler

**Feature**: 001-agent-scheduler
**Date**: 2026-03-13

## Research Summary

This document captures key technical decisions, rationale, and alternatives considered during the design phase. All decisions align with the clarified requirements in the feature specification.

---

## Decision 1: Main Agent Implementation Model

**Decision**: Custom TypeScript orchestrator spawning Claude CLI subprocesses for sub-agents

**Rationale**:
- Full control over orchestration logic (time-slice monitoring, state management, error recovery)
- Claude CLI already handles conversation persistence, tool use, and prompt management for sub-agents
- TypeScript/Node.js ecosystem aligns with CLI tool development patterns
- Clear separation: orchestrator logic in code, agent behavior via prompts

**Alternatives Considered**:
1. **Main agent as Claude CLI instance**: Would require complex prompt engineering for orchestration logic, harder to debug and test, less control over timing
2. **All agents via API**: Would require building conversation persistence, tool handling, and workspace management from scratch

**Architecture Alignment**: Follows modularity principle - orchestrator is a standalone module with clear boundaries.

---

## Decision 2: Session State Persistence

**Decision**: File-based storage using JSON (structured state) and Markdown (human-readable progress)

**Rationale**:
- No database dependency keeps the tool simple and portable
- JSON files enable easy parsing and programmatic access
- Markdown files provide human-readable progress tracking
- Claude CLI already stores conversation history in `.claude/projects/` directory
- File-based approach enables easy debugging and manual inspection

**Alternatives Considered**:
1. **SQLite**: Would add dependency, requires migrations, overkill for single-user tool
2. **In-memory only**: Cannot resume interrupted sessions, violates FR-005

**Files**:
- `session.json` - Structured session state (current phase, retry counts, timestamps)
- `progress.md` - Human-readable progress narrative
- `decisions.json` - Decision history for auditing

---

## Decision 3: Flow Configuration Format

**Decision**: YAML-based configuration files with JSON Schema validation via Zod

**Rationale**:
- YAML is human-readable and supports comments
- Matches industry standards for configuration (Kubernetes, GitHub Actions)
- Zod provides runtime validation with TypeScript type inference
- No compilation step needed for flow definitions

**Alternatives Considered**:
1. **JSON**: Less readable, no comment support
2. **TOML**: Less common in Node.js ecosystem
3. **Code-based flows**: Requires recompilation, violates FR-005 (YAML-based configuration only)

**Validation Strategy**:
- Schema defined in Zod (`flow/types.ts`)
- Validation on load with clear error messages
- Invalid flows skipped with warning (not crash)

---

## Decision 4: Time-Slice Monitoring Mechanism

**Decision**: setTimeout-based polling with configurable intervals per phase

**Rationale**:
- Simple to implement and understand
- Predictable resource usage (one timer per active sub-agent)
- Configurable per phase allows flexibility (short intervals for quick phases, longer for complex)
- No external dependencies required

**Alternatives Considered**:
1. **Event-driven via file watching**: More complex, chokidar events can be noisy, race conditions with rapid writes
2. **Fixed interval**: Less flexible, doesn't adapt to phase complexity

**Implementation**:
- Default time slice: 10 minutes
- Near-completion detection triggers shorter intervals (5 minutes)
- Maximum runtime enforcement per phase

---

## Decision 5: Sub-Agent Status Diagnosis

**Decision**: Conversation log analysis using pattern detection heuristics

**Rationale**:
- Claude CLI stores conversation in `.claude/projects/<encoded-path>/conversation.jsonl`
- Pattern detection for loops: repeated actions, similar outputs, error patterns
- No additional infrastructure needed (uses existing conversation files)
- 80% accuracy target (SC-003) achievable with heuristic approach

**Detection Patterns**:
| Status | Detection Criteria |
|--------|-------------------|
| `completed` | Task marked complete, output files generated |
| `healthy_progress` | New outputs, different actions, no repeated errors |
| `stuck_in_loop` | Same action repeated 4+ times, outputs highly similar |
| `blocked` | Repeated errors, multiple failed attempts |

**Alternatives Considered**:
1. **ML-based classification**: Over-engineering for MVP, requires training data
2. **Explicit status from sub-agent**: Would require modifying Claude CLI behavior

---

## Decision 6: Error Recovery Strategy

**Decision**: Progressive escalation with configurable thresholds

**Rationale**:
- Automatic recovery first (retry with adjusted prompt)
- User intervention as fallback
- Phase-level and flow-level retry limits
- Matches user expectation: autonomous but controllable

**Recovery Flow**:
1. Detect anomaly (loop, block, timeout, crash)
2. Check retry count vs. `max_retries`
3. If under limit: retry with adjusted guidance prompt
4. If over limit: ask user (skip/retry/abort)
5. If `allow_skip: true`: offer skip option

**Prompt Adjustment Strategy**:
- Include diagnosis of what went wrong
- List previously attempted approaches
- Suggest alternative strategies
- Explicitly warn against repeating failed approaches

---

## Decision 7: CLI Framework and Interactive UI

**Decision**: Commander.js for CLI parsing, Inquirer.js for interactive prompts

**Rationale**:
- Commander.js: Mature, well-documented, handles subcommands naturally
- Inquirer.js: Rich interactive prompts (select, confirm, input)
- Both have TypeScript support
- Widely used in Node.js CLI tools

**Command Structure**:
```
agent-os start [--flow <id>]
agent-os resume <session-id> | --last
agent-os stop [<session-id>]
agent-os list
agent-os status [<session-id>]
agent-os flow list
agent-os flow show <id>
agent-os config set <key> <value>
```

**Interactive Commands** (during session):
- `/status` - Show current state
- `/pause` - Pause current phase
- `/resume` - Resume paused phase
- `/skip` - Skip current phase
- `/input <text>` - Provide feedback to sub-agent
- `/log` - View recent logs
- `/stop` - End session

---

## Decision 8: Logging Strategy

**Decision**: Pino for structured JSON logging with CLI access via `/log` command

**Rationale**:
- Pino: High performance, structured JSON output, wide adoption
- Log file path: `~/.agent-os/logs/agent-os.log`
- CLI access via `/log` command with optional filters
- Log levels: trace, debug, info, warn, error
- Satisfies FR-018 (structured logs accessible via CLI)

**Log Format**:
```json
{
  "level": "info",
  "time": "2026-03-13T10:30:00.000Z",
  "sessionId": "abc-123",
  "phase": "implementation",
  "msg": "Sub-agent spawned",
  "pid": 12345
}
```

---

## Decision 9: Session Retention and Cleanup

**Decision**: Configurable retention with automatic cleanup (default: 7 days after completion)

**Rationale**:
- Prevents unbounded disk growth
- User-configurable for different use cases
- Cleanup runs on startup and periodically during idle
- Satisfies FR-017 (configurable retention with auto-cleanup)

**Implementation**:
- Store `completedAt` timestamp in session.json
- Background job checks for expired sessions
- Archive option before delete (optional)
- User can trigger manual cleanup via CLI

---

## Decision 10: Flow Execution Model

**Decision**: Strictly sequential phases (MVP), DAG support planned for future

**Rationale**:
- Sequential is simpler to implement, test, and reason about
- Covers majority of use cases (software development, research, reports)
- DAG/parallel execution adds significant complexity (dependency resolution, merge strategies)
- Matches clarified requirement: "Strictly sequential phases (MVP, DAG support planned for future)"

**Future DAG Considerations**:
- Flow definition schema already designed for extensibility
- Phase dependencies field can be added later
- Executor would need parallel spawn and result aggregation

---

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| commander | ^12.x | CLI argument parsing |
| inquirer | ^9.x | Interactive prompts |
| chokidar | ^3.x | File watching (optional enhancement) |
| js-yaml | ^4.x | Flow configuration parsing |
| zod | ^3.x | Schema validation |
| pino | ^8.x | Structured logging |
| date-fns | ^3.x | Date/time utilities |
| cosmiconfig | ^8.x | Configuration file discovery |

## External Dependencies

| Dependency | Purpose | Failure Mode |
|------------|---------|--------------|
| Claude CLI | Sub-agent execution | Graceful error, prompt user to install |
| Node.js 20+ | Runtime | Version check on startup |
| File system | Session storage | Disk full detection, cleanup trigger |