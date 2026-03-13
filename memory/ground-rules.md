<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: (none) → 1.0.0
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Quality Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .rainbow/templates/templates-for-commands/design-template.md: ✅ aligned
  - .rainbow/templates/templates-for-commands/spec-template.md: ✅ aligned
  - .rainbow/templates/templates-for-commands/tasks-template.md: ✅ aligned
Follow-up TODOs: None
================================================================================
-->

# Agent OS Ground-rules

## Core Principles

### I. Modularity First

Every feature starts as a standalone, self-contained module. Modules MUST be:

- Independently testable with clear boundaries
- Documented with purpose, inputs, outputs, and examples
- Free of hidden dependencies or global state
- Reusable across different contexts without modification

**Rationale**: Modular design enables parallel development, easier testing, and
long-term maintainability. Each skill/command should do one thing well.

### II. CLI Interface

Every module exposes functionality via a clear CLI interface:

- Text in/out protocol: stdin/args → stdout, errors → stderr
- Support both JSON and human-readable output formats
- Exit codes must follow conventions (0 = success, non-zero = error)
- All options documented with `--help`

**Rationale**: CLI interfaces enable composability, automation, and integration
with other tools. Text-based I/O ensures debuggability and scriptability.

### III. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all implementation work:

- Tests MUST be written before implementation
- Tests MUST fail before implementation begins
- Red-Green-Refactor cycle strictly enforced
- User approval required before implementation starts
- Coverage requirements: >80% for core modules

**Rationale**: TDD ensures code correctness, prevents regressions, and serves as
living documentation. The discipline catches bugs early and forces better design.

### IV. Clear Documentation

Every module MUST include comprehensive documentation:

- Purpose and scope clearly stated
- All inputs, outputs, and side effects documented
- Usage examples for common scenarios
- Error conditions and recovery strategies
- Version history for breaking changes

**Rationale**: Documentation enables discoverability, reduces onboarding time,
and ensures long-term maintainability. Undocumented features are effectively
non-existent.

### V. Simplicity

Code MUST prioritize simplicity and readability:

- YAGNI (You Aren't Gonna Need It) - implement only what is needed now
- Prefer composition over inheritance
- Avoid premature optimization
- Delete dead code aggressively
- Refactor when complexity exceeds threshold

**Rationale**: Simple code is easier to understand, maintain, and debug.
Complexity should be justified, not assumed.

## Quality Standards

### Code Quality Gates

All code MUST pass these gates before merge:

- **Linting**: Zero linting errors, warnings addressed or documented
- **Formatting**: Consistent style per project conventions
- **Tests**: All tests pass, coverage thresholds met
- **Documentation**: Public APIs documented, examples provided
- **Review**: At least one peer review approval

### Performance Standards

Performance requirements MUST be defined upfront:

- Response time targets for interactive operations
- Throughput targets for batch operations
- Memory limits for long-running processes
- Startup time limits for CLI tools

### Security Standards

Security MUST be considered from the start:

- Input validation at all external boundaries
- No hardcoded credentials or secrets
- Dependency vulnerability scanning
- Secure handling of user data

## Development Workflow

### Branch Strategy

- `main` branch is always deployable
- Feature branches follow naming: `###-feature-name`
- Commits follow conventional commit format
- Squash merge for feature branches

### Review Process

1. Self-review before requesting peer review
2. Reviewer checks against ground-rules compliance
3. Address all review comments before merge
4. CI must pass before merge

### Continuous Integration

All changes MUST pass CI pipeline:

- Lint and format checks
- Unit and integration tests
- Documentation build
- Security scans

## Governance

### Amendment Procedure

Ground-rules amendments require:

1. Proposal with rationale documented
2. Team discussion and approval
3. Update to this document with version bump
4. Propagation to dependent templates

### Versioning Policy

Ground-rules follow semantic versioning:

- **MAJOR**: Breaking changes to principles or governance
- **MINOR**: New principles or expanded guidance
- **PATCH**: Clarifications, typo fixes, minor refinements

### Compliance Review

All PRs MUST verify compliance with ground-rules. Complexity introduced without
justification MUST be flagged in code review. Use CLAUDE.md or AGENTS.md for
runtime development guidance specific to this project.

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13