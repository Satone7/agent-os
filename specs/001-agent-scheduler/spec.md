# Feature Specification: Agent-OS Multi-Agent Collaboration Scheduler

**Feature Branch**: `001-agent-scheduler`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Agent-driven multi-agent collaboration scheduler"

## Clarifications

### Session 2026-03-13

- Q: What is the user authentication model? → A: Single-user local tool (no authentication required)
- Q: What is the session data retention policy? → A: Configurable retention period with auto-cleanup (default 7 days)
- Q: What observability and debugging support is needed? → A: Structured logs with CLI access (`/log` command, log files)
- Q: How is the main agent implemented? → A: Custom orchestrator spawning Claude CLI sub-agents
- Q: What is the flow execution model? → A: Strictly sequential phases (MVP, DAG support planned for future)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute Predefined Workflow (Priority: P1)

As a user, I want to describe what I want to build and have the system automatically match and execute an appropriate workflow, so that complex tasks are broken down and completed systematically.

**Why this priority**: This is the core value proposition - users interact with the system through natural language and get complex work done through automated agent orchestration.

**Independent Test**: Can be fully tested by starting a session with a request like "I want to develop a todo app", verifying the system matches the correct flow (software-development), and confirming sub-agents execute each phase.

**Acceptance Scenarios**:

1. **Given** the system has a software-development flow configured, **When** a user says "I want to develop a todo app", **Then** the system matches the software-development flow and presents the phases to the user
2. **Given** a flow has been matched, **When** the user confirms to proceed, **Then** the main agent starts the first phase and launches a sub-agent
3. **Given** a sub-agent is running, **When** the time slice expires, **Then** the main agent wakes up, checks the sub-agent status, and decides the next action
4. **Given** all phases are completed, **When** the main agent runs its final check, **Then** the session transitions to completed state and outputs results to the user

---

### User Story 2 - Monitor and Control Running Agents (Priority: P2)

As a user, I want to check the status of running agents at any time and intervene when needed, so that I maintain control over long-running processes.

**Why this priority**: User control and visibility are essential for trust in an autonomous system. Users need to understand what's happening and be able to intervene.

**Independent Test**: Can be tested by starting a session, pressing Enter during execution to see status, and using commands like `/pause`, `/input`, `/skip` to control the flow.

**Acceptance Scenarios**:

1. **Given** a sub-agent is running, **When** the user presses Enter, **Then** the system displays current phase, running time, status, and recent activity
2. **Given** a sub-agent is running, **When** the user types `/input <feedback>`, **Then** the feedback is passed to the sub-agent for processing in the next time slice
3. **Given** a sub-agent is running, **When** the user types `/pause`, **Then** the current phase is paused and the user can inspect or provide input
4. **Given** a phase is paused, **When** the user types `/resume`, **Then** the phase continues from where it left off

---

### User Story 3 - Automatic Error Recovery (Priority: P2)

As a user, I want the system to automatically detect when a sub-agent is stuck or failing and attempt intelligent recovery, so that I don't need to constantly monitor for problems.

**Why this priority**: Autonomous operation requires self-healing capabilities. The system should handle common failure modes without human intervention.

**Independent Test**: Can be tested by simulating a sub-agent that enters a loop, encounters repeated errors, or times out, then verifying the main agent detects the issue and takes appropriate recovery action.

**Acceptance Scenarios**:

1. **Given** a sub-agent has been repeating the same action for 4+ turns, **When** the main agent checks status, **Then** it detects "stuck_in_loop" and either adjusts the prompt or asks the user for help
2. **Given** a sub-agent encounters repeated errors, **When** the main agent checks status, **Then** it diagnoses "blocked" status and attempts retry with adjusted guidance
3. **Given** a phase has failed 3 times, **When** the main agent evaluates recovery options, **Then** it asks the user whether to skip, retry, or abort
4. **Given** a phase is configured with `allow_skip: true`, **When** recovery fails, **Then** the user is offered the option to skip and continue to the next phase

---

### User Story 4 - Resume Interrupted Sessions (Priority: P3)

As a user, I want to resume a previously interrupted session and continue from where I left off, so that my progress is never lost even if the system crashes or I need to stop.

**Why this priority**: Session persistence and recovery ensure reliability. Users shouldn't lose work due to unexpected interruptions.

**Independent Test**: Can be tested by starting a session, stopping it mid-execution with Ctrl+C, then using `agent-os resume` to continue from the saved state.

**Acceptance Scenarios**:

1. **Given** a session was interrupted during phase 2 of 5, **When** the user runs `agent-os resume <session-id>`, **Then** the main agent loads the saved context and continues from phase 2
2. **Given** multiple sessions exist, **When** the user runs `agent-os resume --last`, **Then** the most recent session is resumed
3. **Given** a session is resumed, **When** the main agent loads context, **Then** all previous decisions, clarifications, and outputs are preserved

---

### User Story 5 - Extend with Custom Flows (Priority: P3)

As an advanced user, I want to define my own flows with custom phases, so that I can adapt the system to different types of work beyond software development.

**Why this priority**: Extensibility is a core design principle. The system should be useful for various workflows, not just software development.

**Independent Test**: Can be tested by creating a new flow YAML file with custom phases, then triggering it with matching keywords.

**Acceptance Scenarios**:

1. **Given** a user creates `flows/custom-workflow.yaml`, **When** the user restarts the system or runs `agent-os flow list`, **Then** the new flow appears in the available flows list
2. **Given** a custom flow is defined with trigger keywords, **When** the user's request matches a keyword, **Then** the custom flow is selected
3. **Given** a flow has invalid YAML syntax, **When** the system loads flows, **Then** a validation error is shown and the flow is skipped without crashing the system

---

### Edge Cases

- What happens when a sub-agent process crashes unexpectedly? The main agent detects the crash via process monitoring and attempts restart with retry count incremented.
- What happens when Claude CLI is not installed or unavailable? The system fails gracefully with a clear error message indicating the dependency is missing.
- What happens when no flow matches the user's request? The main agent asks the user to clarify or select from available flows.
- What happens when the workspace disk is full? The system detects write failures, alerts the user, and offers to run cleanup of expired sessions to free space.
- What happens when a phase's `require_user_confirm` is true? The main agent pauses before the next phase and waits for explicit user approval.
- What happens when the maximum total retries is exceeded? The flow is aborted and the user is notified of the failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to start new sessions with natural language requests
- **FR-002**: System MUST match user requests to predefined flows using keywords and regex patterns
- **FR-003**: System MUST maintain a main agent responsible for flow orchestration and sub-agent coordination
- **FR-004**: System MUST spawn sub-agents as separate processes to execute individual flow phases
- **FR-005**: System MUST persist session state to files so sessions can be resumed after interruption
- **FR-006**: System MUST implement time-slice based monitoring where the main agent periodically checks sub-agent status
- **FR-007**: System MUST allow users to intervene at any time during execution (pause, skip, provide input, stop)
- **FR-008**: System MUST detect sub-agent anomalies including loops, blocks, timeouts, and crashes
- **FR-009**: System MUST attempt automatic recovery before asking for user help (retry, prompt adjustment)
- **FR-010**: System MUST support configurable retry limits at both phase and flow levels
- **FR-011**: System MUST allow phases to be marked as skippable or requiring user confirmation
- **FR-012**: System MUST provide a CLI for session management (start, resume, stop, list, status)
- **FR-013**: System MUST load flows from configurable paths including user-defined locations
- **FR-014**: System MUST validate flow configurations and report errors without crashing
- **FR-015**: System MUST isolate each session's workspace to prevent interference between concurrent sessions
- **FR-016**: System MUST operate as a single-user local CLI tool without built-in authentication (relies on underlying Claude CLI authentication)
- **FR-017**: System MUST support configurable session retention with automatic cleanup of expired sessions (default: 7 days after completion)
- **FR-018**: System MUST maintain structured logs accessible via CLI (`/log` command) for debugging and auditing
- **FR-019**: System MUST execute flow phases in strictly sequential order (DAG/parallel support planned for future versions)

### Key Entities

- **Session**: Represents a single execution of a flow. Contains id, state (created/running/paused/completed/stopped), workspace path, flow reference, current phase index, and status for all phases.

- **Flow**: A predefined workflow template. Contains id, name, version, trigger conditions (keywords/patterns), strictly ordered phases (sequential execution only in MVP), and flow-level settings. Future versions may support DAG-based parallel execution.

- **Phase**: A single step within a flow. Contains id, name, description, agent configuration (model, prompt template, skills, tools), time slice settings, expected outputs, and phase config (max retries, skippable, requires confirmation).

- **Main Agent**: A custom orchestrator program (not a Claude CLI instance) responsible for flow orchestration. Accepts user input, matches flows, spawns sub-agents via Claude CLI subprocesses, monitors progress, makes decisions (continue/retry/skip/ask), and persists state.

- **Sub Agent**: A worker agent spawned to execute a specific phase. Runs in non-interactive mode with a scoped workspace, writes outputs to files, and communicates status through conversation logs.

- **Workspace**: An isolated directory for a session. Contains main agent state files (session.json, progress.md, decisions.json) and sub-agent workspaces for each phase.

- **Time Slice**: A monitoring interval. When the interval expires, the main agent wakes up to check sub-agent status. Default duration is configurable per phase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can describe a task in one sentence and have the system start executing within 30 seconds
- **SC-002**: Session state is fully recoverable within 5 seconds of resuming an interrupted session
- **SC-003**: The system correctly detects stuck or blocked sub-agents with at least 80% accuracy based on conversation pattern analysis
- **SC-004**: Users can view real-time status and intervene within 2 seconds of pressing Enter or typing a command
- **SC-005**: Custom flows can be added without modifying source code (YAML-based configuration only)
- **SC-006**: A standard software development flow (5 phases) completes end-to-end for a simple application with less than 3 user interventions on average
- **SC-007**: The system handles at least 5 concurrent sessions without degradation in responsiveness
- **SC-008**: Recovery from a sub-agent crash completes within 60 seconds including retry attempt