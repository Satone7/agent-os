/**
 * Scheduler Core Module Contracts
 */

import type { Session, SessionState, PhaseStatus } from '../types/index.js';

/**
 * Main scheduler interface for session management
 */
export interface IScheduler {
  createSession(userRequest: string): Promise<Session>;
  resumeSession(sessionId: string): Promise<Session>;
  stopSession(sessionId: string): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  listSessions(state?: SessionState): Promise<Session[]>;
  getLastSession(): Promise<Session | null>;
}

/**
 * Session lifecycle management
 */
export interface ISessionManager {
  initializeWorkspace(sessionId: string): Promise<string>;
  loadState(sessionId: string): Promise<Session>;
  saveState(session: Session): Promise<void>;
  updatePhaseStatus(
    sessionId: string,
    phaseId: string,
    status: Partial<PhaseStatus>
  ): Promise<void>;
  recordDecision(sessionId: string, decision: DecisionRecord): Promise<void>;
  loadDecisions(sessionId: string): Promise<DecisionRecord[]>;
  archiveSession(sessionId: string): Promise<string>;
  deleteSession(sessionId: string): Promise<void>;
}

/**
 * Decision record for auditing
 */
export interface DecisionRecord {
  timestamp: string;
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
 * Time-slice monitoring interface
 */
export interface IMonitor {
  startMonitoring(
    processId: string,
    duration: string,
    callback: () => Promise<void>
  ): MonitorHandle;
  cancelMonitoring(handle: MonitorHandle): void;
  getRemainingTime(handle: MonitorHandle): number;
  extendTimeSlice(handle: MonitorHandle, additionalDuration: string): void;
}

/**
 * Monitor handle for tracking active monitors
 */
export interface MonitorHandle {
  id: string;
  processId: string;
  startTime: Date;
  duration: number;
}