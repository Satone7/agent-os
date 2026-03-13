/**
 * Session type definitions
 */

/**
 * Session state enum
 */
export type SessionState =
  | 'created'
  | 'running'
  | 'paused'
  | 'completed'
  | 'stopped';

/**
 * Represents a single execution of a flow
 */
export interface Session {
  /** Unique session identifier (UUID v4) */
  id: string;
  /** Current state */
  state: SessionState;
  /** Absolute path to session workspace */
  workspacePath: string;
  /** Reference to flow definition */
  flowId: string;
  /** Human-readable flow name (denormalized) */
  flowName: string;
  /** Index of current phase (0-based) */
  currentPhaseIndex: number;
  /** ID of current phase */
  currentPhase: string;
  /** Status map keyed by phase ID */
  phaseStatus: Record<string, PhaseStatus>;
  /** Cumulative retry count across all phases */
  totalRetries: number;
  /** Count of user intervention events */
  userInterventions: number;
  /** Session creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Completion timestamp (for retention) */
  completedAt?: string;
  /** Original user request text */
  userRequest: string;
  /** Last status check timestamp */
  lastCheckTime?: string;
  /** Next action to take (for resume) */
  nextAction?: string;
  /** Parameters for next action */
  nextActionParams?: Record<string, unknown>;
}

/**
 * Tracks the status of a single phase within a session
 */
export interface PhaseStatus {
  /** Phase status */
  status: PhaseStatusValue;
  /** When phase started */
  startTime?: string;
  /** When phase ended */
  endTime?: string;
  /** Retry attempts for this phase */
  retryCount: number;
  /** History of granted time slices */
  grantedTimeSlices: string[];
  /** Error details if failed */
  error?: PhaseError;
}

/**
 * Phase status values
 */
export type PhaseStatusValue =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Captures error details for failed phases
 */
export interface PhaseError {
  /** Error type */
  type: PhaseErrorType;
  /** Human-readable error description */
  message: string;
  /** When error occurred */
  timestamp: string;
  /** Error severity */
  severity: 'minor' | 'major' | 'critical';
  /** Additional diagnostic data */
  context?: Record<string, unknown>;
}

/**
 * Phase error types
 */
export type PhaseErrorType =
  | 'startup_failed'
  | 'timeout'
  | 'crash'
  | 'stuck_in_loop'
  | 'blocked'
  | 'output_validation_failed';