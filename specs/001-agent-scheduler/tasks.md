# Tasks: Agent-OS Multi-Agent Collaboration Scheduler

**Input**: Design documents from `specs/001-agent-scheduler/`
**Prerequisites**: design.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Required - TDD is NON-NEGOTIABLE per ground-rules.md Principle III.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project CLI tool**: `src/`, `tests/` at repository root
- See design.md for full project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directory structure per design.md
- [ ] T002 Initialize Node.js project with package.json (ESM, Node 20+)
- [ ] T003 [P] Configure TypeScript with tsconfig.json (strict mode, ESM)
- [ ] T004 [P] Configure Vitest for testing in vitest.config.ts
- [ ] T005 [P] Configure ESLint and Prettier in .eslintrc.json and .prettierrc
- [ ] T006 [P] Install dependencies: commander, inquirer, chokidar, js-yaml, zod, pino, date-fns, cosmiconfig
- [ ] T007 Create src/types/index.ts barrel export for shared types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Types

- [ ] T008 [P] Define Session type in src/types/session.ts
- [ ] T009 [P] Define Flow and Phase types in src/types/flow.ts
- [ ] T010 [P] Define error types in src/types/errors.ts
- [ ] T011 [P] Define time slice and duration utilities in src/utils/time.ts

### Logging Infrastructure

- [ ] T012 Implement pino logger factory in src/logging/logger.ts

### Validation Foundation

- [ ] T013 [P] Define Zod schema for Flow in src/flow/validator.ts
- [ ] T014 [P] Define Zod schema for Session state in src/schemas/session-schema.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Execute Predefined Workflow (Priority: P1) 🎯 MVP

**Goal**: Users can describe a task and have the system automatically match and execute an appropriate workflow

**Independent Test**: Start a session with "I want to develop a todo app", verify flow matching, and confirm sub-agents execute phases

### Tests for User Story 1 (TDD - Write First)

- [ ] T015 [P] [US1] Unit test for flow matching in tests/unit/flow/flow-matcher.test.ts
- [ ] T016 [P] [US1] Unit test for flow loader in tests/unit/flow/loader.test.ts
- [ ] T017 [P] [US1] Unit test for session manager in tests/unit/scheduler/session-manager.test.ts
- [ ] T018 [P] [US1] Unit test for spawner in tests/unit/scheduler/spawner.test.ts
- [ ] T019 [P] [US1] Integration test for session lifecycle in tests/integration/session-lifecycle.test.ts

### Implementation for User Story 1

#### Flow Engine (Flow Matching)

- [ ] T020 [P] [US1] Implement IFlowLoader interface in src/flow/loader.ts
- [ ] T021 [P] [US1] Implement flow validator in src/flow/validator.ts
- [ ] T022 [US1] Implement flow matcher with keyword/pattern matching in src/agent/flow-matcher.ts
- [ ] T023 [US1] Create sample flow YAML in flows/software-development.yaml

#### Session Management

- [ ] T024 [P] [US1] Implement ISessionManager in src/scheduler/session-manager.ts
- [ ] T025 [P] [US1] Implement state serializer in src/agent/state-serializer.ts

#### Sub-Agent Spawning

- [ ] T026 [US1] Implement ISpawner with Claude CLI subprocess in src/scheduler/spawner.ts
- [ ] T027 [US1] Implement conversation path resolver in src/utils/conversation-path.ts

#### CLI Commands

- [ ] T028 [US1] Implement CLI entry point in src/cli/index.ts
- [ ] T029 [P] [US1] Implement start command in src/cli/commands/start.ts
- [ ] T030 [P] [US1] Implement status command in src/cli/commands/status.ts
- [ ] T031 [P] [US1] Implement list command in src/cli/commands/list.ts

#### Workspace Management

- [ ] T032 [US1] Implement IWorkspaceManager in src/workspace/manager.ts

**Checkpoint**: User Story 1 complete - users can start sessions, match flows, and execute phases

---

## Phase 4: User Story 2 - Monitor and Control Running Agents (Priority: P2)

**Goal**: Users can check agent status at any time and intervene with pause, resume, skip, input commands

**Independent Test**: Start a session, press Enter to see status, use `/pause`, `/input`, `/skip` to control

### Tests for User Story 2 (TDD - Write First)

- [ ] T033 [P] [US2] Unit test for monitor in tests/unit/scheduler/monitor.test.ts
- [ ] T034 [P] [US2] Unit test for interactive commands in tests/unit/cli/interactive.test.ts
- [ ] T035 [P] [US2] Integration test for user intervention in tests/integration/user-intervention.test.ts

### Implementation for User Story 2

#### Time-Slice Monitoring

- [ ] T036 [US2] Implement IMonitor with setTimeout polling in src/scheduler/monitor.ts

#### Interactive Commands

- [ ] T037 [P] [US2] Implement `/status` interactive command in src/cli/interactive/status.ts
- [ ] T038 [P] [US2] Implement `/pause` interactive command in src/cli/interactive/pause.ts
- [ ] T039 [P] [US2] Implement `/resume` interactive command in src/cli/interactive/resume.ts
- [ ] T040 [P] [US2] Implement `/skip` interactive command in src/cli/interactive/skip.ts
- [ ] T041 [P] [US2] Implement `/input` interactive command in src/cli/interactive/input.ts
- [ ] T042 [P] [US2] Implement `/stop` interactive command in src/cli/interactive/stop.ts

#### Status Display

- [ ] T043 [US2] Implement status formatter in src/cli/formatters/status.ts

**Checkpoint**: User Story 2 complete - users can monitor and control running agents

---

## Phase 5: User Story 3 - Automatic Error Recovery (Priority: P2)

**Goal**: System automatically detects stuck/blocked sub-agents and attempts intelligent recovery

**Independent Test**: Simulate a sub-agent entering a loop, verify main agent detects and recovers

### Tests for User Story 3 (TDD - Write First)

- [ ] T044 [P] [US3] Unit test for loop detection in tests/unit/agent/diagnostician.test.ts
- [ ] T045 [P] [US3] Unit test for block detection in tests/unit/agent/diagnostician.test.ts
- [ ] T046 [P] [US3] Unit test for recovery decisions in tests/unit/agent/controller.test.ts
- [ ] T047 [P] [US3] Integration test for error recovery in tests/integration/error-recovery.test.ts

### Implementation for User Story 3

#### Diagnostics

- [ ] T048 [US3] Implement IDiagnostician in src/agent/diagnostician.ts
- [ ] T049 [P] [US3] Implement loop detection algorithm in src/agent/diagnostics/loop-detector.ts
- [ ] T050 [P] [US3] Implement block detection algorithm in src/agent/diagnostics/block-detector.ts
- [ ] T051 [P] [US3] Implement completion detection in src/agent/diagnostics/completion-detector.ts

#### Recovery Logic

- [ ] T052 [US3] Implement recovery decision logic in src/agent/recovery.ts
- [ ] T053 [US3] Create recovery prompt templates in prompts/recovery/loop-break.md
- [ ] T054 [P] [US3] Create recovery prompt templates in prompts/recovery/timeout-guidance.md

#### Main Agent Controller

- [ ] T055 [US3] Implement IController main loop in src/agent/controller.ts

**Checkpoint**: User Story 3 complete - system can detect and recover from errors automatically

---

## Phase 6: User Story 4 - Resume Interrupted Sessions (Priority: P3)

**Goal**: Users can resume interrupted sessions and continue from where they left off

**Independent Test**: Start a session, stop with Ctrl+C, resume with `agent-os resume`

### Tests for User Story 4 (TDD - Write First)

- [ ] T056 [P] [US4] Unit test for session resume in tests/unit/scheduler/session-manager.test.ts
- [ ] T057 [P] [US4] Integration test for session persistence in tests/integration/session-persistence.test.ts

### Implementation for User Story 4

#### Resume Command

- [ ] T058 [US4] Implement resume command in src/cli/commands/resume.ts
- [ ] T059 [US4] Implement `--last` flag for most recent session in src/cli/commands/resume.ts

#### Session Persistence

- [ ] T060 [US4] Enhance state serializer for crash recovery in src/agent/state-serializer.ts
- [ ] T061 [US4] Implement session state validation on load in src/scheduler/session-validator.ts

**Checkpoint**: User Story 4 complete - sessions persist and can be resumed

---

## Phase 7: User Story 5 - Extend with Custom Flows (Priority: P3)

**Goal**: Users can define custom flows via YAML configuration

**Independent Test**: Create a custom flow YAML, verify it appears in flow list and can be triggered

### Tests for User Story 5 (TDD - Write First)

- [ ] T062 [P] [US5] Unit test for custom flow loading in tests/unit/flow/loader.test.ts
- [ ] T063 [P] [US5] Unit test for flow validation errors in tests/unit/flow/validator.test.ts
- [ ] T064 [P] [US5] Integration test for custom flow execution in tests/integration/custom-flow.test.ts

### Implementation for User Story 5

#### Flow Discovery

- [ ] T065 [US5] Implement configurable flow paths in src/flow/paths.ts
- [ ] T066 [US5] Implement flow hot-reload in src/flow/hot-reload.ts

#### Flow Commands

- [ ] T067 [P] [US5] Implement `flow list` command in src/cli/commands/flow.ts
- [ ] T068 [P] [US5] Implement `flow show` command in src/cli/commands/flow.ts

#### Validation

- [ ] T069 [US5] Enhance validator with detailed error messages in src/flow/validator.ts

**Checkpoint**: User Story 5 complete - users can extend with custom flows

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Logging & Observability

- [ ] T070 [P] Implement `/log` command in src/cli/interactive/log.ts
- [ ] T071 [P] Add structured logging throughout modules

### Session Retention

- [ ] T072 Implement IRetentionPolicy in src/workspace/retention.ts
- [ ] T073 [P] Implement cleanup command in src/cli/commands/cleanup.ts

### Stop Command

- [ ] T074 Implement stop command in src/cli/commands/stop.ts

### Configuration

- [ ] T075 [P] Implement global config loading in src/config/loader.ts
- [ ] T076 [P] Implement project config in src/config/project-config.ts

### Documentation & Validation

- [ ] T077 Create sample prompt templates in prompts/sub-agent/*.md
- [ ] T078 Run quickstart.md validation scenarios
- [ ] T079 Create test fixtures in tests/fixtures/flows/

### Quality Gates

- [ ] T080 Ensure >80% test coverage for core modules
- [ ] T081 Run all linting and fix warnings
- [ ] T082 Final integration test of all user stories together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2/US3 → US4/US5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Uses spawner from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Uses spawner from US1 but independently testable
- **User Story 4 (P3)**: Can start after Foundational - Uses session manager from US1
- **User Story 5 (P3)**: Can start after Foundational - Uses flow loader from US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/interfaces before implementations
- Core implementations before CLI commands
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational type definitions can run in parallel
- Once Foundational phase completes:
  - US2 and US3 can run in parallel
  - US4 and US5 can run in parallel
- Within each story: tests can be written in parallel, models can be created in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for flow matching in tests/unit/flow/flow-matcher.test.ts"
Task: "Unit test for flow loader in tests/unit/flow/loader.test.ts"
Task: "Unit test for session manager in tests/unit/scheduler/session-manager.test.ts"
Task: "Unit test for spawner in tests/unit/scheduler/spawner.test.ts"
Task: "Integration test for session lifecycle in tests/integration/session-lifecycle.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test that users can start sessions and execute flows
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 + 3 → Test independently → Enhanced control and reliability
4. Add User Story 4 + 5 → Test independently → Full feature set
5. Polish phase → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP - highest priority)
   - Developer B: User Story 2 (after US1 spawner exists)
   - Developer C: User Story 3 (after US1 spawner exists)
3. After US1:
   - Developer D: User Story 4
   - Developer E: User Story 5

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD is mandatory - verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Ground-rules compliance: modularity, CLI interface, TDD, documentation, simplicity