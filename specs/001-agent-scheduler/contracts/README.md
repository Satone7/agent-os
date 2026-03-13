# Internal Module Contracts

This directory defines the interfaces between internal modules. These contracts ensure clear boundaries and enable independent testing of each module.

## Contract Files

| File | Purpose |
|------|---------|
| [scheduler.ts](./scheduler.ts) | Scheduler core interfaces (IScheduler, ISessionManager, IMonitor) |
| [agent.ts](./agent.ts) | Agent runtime interfaces (ISpawner, IDiagnostician, IController) |
| [flow.ts](./flow.ts) | Flow engine interfaces (ILoader, IExecutor, IValidator) |
| [workspace.ts](./workspace.ts) | Workspace management interfaces (IWorkspaceManager, IRetentionPolicy) |
| [events.ts](./events.ts) | Event types for inter-module communication |

## Design Principles

1. **Dependency Injection**: All interfaces are designed for DI, enabling easy mocking in tests
2. **Async-First**: All operations that may involve I/O return Promises
3. **Error Transparency**: Errors are typed and documented in each interface
4. **Single Responsibility**: Each interface has one clear purpose