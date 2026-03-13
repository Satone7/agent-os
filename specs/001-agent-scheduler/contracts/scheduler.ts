/**
 * Scheduler Core Module Contracts
 *
 * These interfaces define the boundaries of the scheduler module,
 * which manages session lifecycle and orchestrates monitoring.
 */

import type { Session, SessionState, PhaseStatus, PhaseError } from '../data-model';

/**
 * Main scheduler interface for session management
 */
export interface IScheduler {
  /**
   * Create a new session from a user request
   * @param userRequest - Natural language request from user
   * @returns Created session in 'created' state
   */
  createSession(userRequest: string): Promise<Session>;

  /**
   * Resume an existing session by ID
   * @param sessionId - Session UUID
   * @returns Session in previous state, ready to continue
   * @throws SessionNotFoundError if session doesn't exist
   */
  resumeSession(sessionId: string): Promise<Session>;

  /**
   * Stop a running session
   * @param sessionId - Session UUID
   */
  stopSession(sessionId: string): Promise<void>;

  /**
   * Get session by ID
   * @param sessionId - Session UUID
   * @returns Session or null if not found
   */
  getSession(sessionId: string): Promise<Session | null>;

  /**
   * List all sessions (optionally filtered by state)
   * @param state - Optional state filter
   * @returns Array of sessions
   */
  listSessions(state?: SessionState): Promise<Session[]>;

  /**
   * Get the most recent session
   * @returns Most recent session or null if none exist
   */
  getLastSession(): Promise<Session | null>;
}

/**
 * Session lifecycle management
 */
export interface ISessionManager {
  /**
   * Initialize a new session workspace
   * @param sessionId - Session UUID
   * @returns Path to created workspace
   */
  initializeWorkspace(sessionId: string): Promise<string>;

  /**
   * Load session state from disk
   * @param sessionId - Session UUID
   * @returns Session state
   * @throws SessionNotFoundError
   */
  loadState(sessionId: string): Promise<Session>;

  /**
   * Persist session state to disk
   * @param session - Session to persist
   */
  saveState(session: Session): Promise<void>;

  /**
   * Update phase status within a session
   * @param sessionId - Session UUID
   * @param phaseId - Phase ID
   * @param status - New status
   */
  updatePhaseStatus(
    sessionId: string,
    phaseId: string,
    status: Partial<PhaseStatus>
  ): Promise<void>;

  /**
   * Record a decision in session history
   * @param sessionId - Session UUID
   * @param decision - Decision record
   */
  recordDecision(sessionId: string, decision: DecisionRecord): Promise<void>;

  /**
   * Archive a completed session
   * @param sessionId - Session UUID
   * @returns Path to archive
   */
  archiveSession(sessionId: string): Promise<string>;

  /**
   * Delete a session and its workspace
   * @param sessionId - Session UUID
   */
  deleteSession(sessionId: string): Promise<void>;
}

/**
 * Time-slice monitoring interface
 */
export interface IMonitor {
  /**
   * Start monitoring a sub-agent
   * @param processId - Sub-agent process ID
   * @param duration - Time slice duration (e.g., "10m")
   * @param callback - Called when time slice expires
   * @returns Monitor handle for cancellation
   */
  startMonitoring(
    processId: string,
    duration: string,
    callback: () => Promise<void>
  ): MonitorHandle;

  /**
   * Cancel active monitoring
   * @param handle - Monitor handle from startMonitoring
   */
  cancelMonitoring(handle: MonitorHandle): void;

  /**
   * Get remaining time in current time slice
   * @param handle - Monitor handle
   * @returns Remaining milliseconds, or 0 if expired/not found
   */
  getRemainingTime(handle: MonitorHandle): number;

  /**
   * Extend current time slice
   * @param handle - Monitor handle
   * @param additionalDuration - Additional time (e.g., "5m")
   */
  extendTimeSlice(handle: MonitorHandle, additionalDuration: string): void;
}

/**
 * Monitor handle for tracking active monitors
 */
export interface MonitorHandle {
  id: string;
  processId: string;
  startTime: Date;
  duration: number; // milliseconds
}

/**
 * Decision record for auditing
 */
export interface DecisionRecord {
  timestamp: string; // ISO 8601
  action: DecisionAction;
  params?: Record<string, unknown>;
  reason: string;
}

export type DecisionAction =
  | 'start_flow'
  | 'start_next_phase'
  | 'grant_time_slice'
  | 'check_subagent'
  | 'retry_phase'
  | 'skip_phase'
  | 'ask_user'
  | 'complete_flow';

/**
 * Errors
 */
export class SessionNotFoundError extends Error {
  constructor(public readonly sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionStateError extends Error {
  constructor(
    public readonly sessionId: string,
    public readonly currentState: SessionState,
    public readonly expectedStates: SessionState[]
  ) {
    super(
      `Invalid session state: ${currentState}. Expected: ${expectedStates.join(', ')}`
    );
    this.name = 'SessionStateError';
  }
}