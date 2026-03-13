/**
 * Base interactive command interface
 */

/**
 * Base interface for interactive commands
 */
export interface IInteractiveCommand {
  /** Command name (e.g., /status, /pause) */
  readonly name: string;

  /** Command description */
  readonly description: string;

  /** Execute the command */
  execute(context: CommandContext): Promise<CommandResult>;
}

/**
 * Command execution context
 */
export interface CommandContext {
  /** Session ID */
  sessionId: string;

  /** User input (for /input command) */
  input?: string;

  /** Current phase ID */
  currentPhase?: string;

  /** Services */
  services: {
    sessionManager: {
      loadState: (id: string) => Promise<unknown>;
      saveState: (state: unknown) => Promise<void>;
      updatePhaseStatus: (
        sessionId: string,
        phaseId: string,
        status: Record<string, unknown>
      ) => Promise<void>;
    };
    spawner?: {
      sendInput: (processId: string, input: string) => Promise<void>;
      kill: (processId: string, force?: boolean) => Promise<void>;
    };
    monitor?: {
      cancelMonitoring: (handle: unknown) => void;
    };
  };
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;

  /** Output message to display */
  message: string;

  /** Whether to continue the session */
  continue: boolean;
}