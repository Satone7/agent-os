/**
 * Event Types for Inter-Module Communication
 *
 * These event types enable loose coupling between modules.
 * The event emitter pattern allows modules to react to state changes
 * without direct dependencies.
 */

import type { SessionState, PhaseStatus, PhaseError } from '../data-model';
import type { DiagnosticResult, SubAgentProcess } from './agent';

/**
 * Event emitter interface for type-safe event handling
 */
export interface IEventEmitter {
  on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void;
  off<K extends keyof EventMap>(event: K, listener: EventMap[K]): void;
  emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void;
}

/**
 * All events emitted by the system
 */
export interface EventMap {
  // Session lifecycle
  'session:created': (event: SessionCreatedEvent) => void;
  'session:started': (event: SessionStartedEvent) => void;
  'session:paused': (event: SessionPausedEvent) => void;
  'session:resumed': (event: SessionResumedEvent) => void;
  'session:completed': (event: SessionCompletedEvent) => void;
  'session:stopped': (event: SessionStoppedEvent) => void;

  // Phase lifecycle
  'phase:started': (event: PhaseStartedEvent) => void;
  'phase:completed': (event: PhaseCompletedEvent) => void;
  'phase:failed': (event: PhaseFailedEvent) => void;
  'phase:skipped': (event: PhaseSkippedEvent) => void;
  'phase:retrying': (event: PhaseRetryingEvent) => void;

  // Sub-agent events
  'subagent:spawned': (event: SubAgentSpawnedEvent) => void;
  'subagent:checking': (event: SubAgentCheckingEvent) => void;
  'subagent:diagnosed': (event: SubAgentDiagnosedEvent) => void;
  'subagent:terminated': (event: SubAgentTerminatedEvent) => void;

  // User interaction
  'user:input_requested': (event: UserInputRequestedEvent) => void;
  'user:input_received': (event: UserInputReceivedEvent) => void;
  'user:decision_required': (event: UserDecisionRequiredEvent) => void;

  // Flow events
  'flow:matched': (event: FlowMatchedEvent) => void;
  'flow:not_found': (event: FlowNotFoundEvent) => void;

  // System events
  'system:error': (event: SystemErrorEvent) => void;
  'system:cleanup': (event: SystemCleanupEvent) => void;
}

// =============================================================================
// Session Events
// =============================================================================

export interface SessionCreatedEvent {
  sessionId: string;
  userRequest: string;
  timestamp: Date;
}

export interface SessionStartedEvent {
  sessionId: string;
  flowId: string;
  flowName: string;
  phaseCount: number;
  timestamp: Date;
}

export interface SessionPausedEvent {
  sessionId: string;
  currentPhase: string;
  reason: 'user_request' | 'user_confirm' | 'error';
  timestamp: Date;
}

export interface SessionResumedEvent {
  sessionId: string;
  currentPhase: string;
  timestamp: Date;
}

export interface SessionCompletedEvent {
  sessionId: string;
  flowId: string;
  totalDuration: number; // milliseconds
  phaseCount: number;
  totalRetries: number;
  userInterventions: number;
  timestamp: Date;
}

export interface SessionStoppedEvent {
  sessionId: string;
  reason: 'user_request' | 'error' | 'timeout';
  currentPhase?: string;
  timestamp: Date;
}

// =============================================================================
// Phase Events
// =============================================================================

export interface PhaseStartedEvent {
  sessionId: string;
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  totalPhases: number;
  timestamp: Date;
}

export interface PhaseCompletedEvent {
  sessionId: string;
  phaseId: string;
  phaseName: string;
  duration: number; // milliseconds
  outputs: string[];
  timestamp: Date;
}

export interface PhaseFailedEvent {
  sessionId: string;
  phaseId: string;
  phaseName: string;
  error: PhaseError;
  retryCount: number;
  timestamp: Date;
}

export interface PhaseSkippedEvent {
  sessionId: string;
  phaseId: string;
  phaseName: string;
  reason: string;
  timestamp: Date;
}

export interface PhaseRetryingEvent {
  sessionId: string;
  phaseId: string;
  phaseName: string;
  retryCount: number;
  maxRetries: number;
  adjustedPrompt?: string;
  timestamp: Date;
}

// =============================================================================
// Sub-Agent Events
// =============================================================================

export interface SubAgentSpawnedEvent {
  sessionId: string;
  phaseId: string;
  processId: string;
  pid: number;
  workspacePath: string;
  timeSlice: string;
  timestamp: Date;
}

export interface SubAgentCheckingEvent {
  sessionId: string;
  phaseId: string;
  processId: string;
  runningTime: number; // milliseconds
  timestamp: Date;
}

export interface SubAgentDiagnosedEvent {
  sessionId: string;
  phaseId: string;
  processId: string;
  diagnosis: DiagnosticResult;
  timestamp: Date;
}

export interface SubAgentTerminatedEvent {
  sessionId: string;
  phaseId: string;
  processId: string;
  reason: 'completed' | 'killed' | 'crashed' | 'timeout';
  exitCode?: number;
  timestamp: Date;
}

// =============================================================================
// User Interaction Events
// =============================================================================

export interface UserInputRequestedEvent {
  sessionId: string;
  phaseId?: string;
  prompt: string;
  options?: string[];
  timestamp: Date;
}

export interface UserInputReceivedEvent {
  sessionId: string;
  phaseId?: string;
  input: string;
  timestamp: Date;
}

export interface UserDecisionRequiredEvent {
  sessionId: string;
  phaseId: string;
  question: string;
  options: string[];
  context: {
    retryCount: number;
    errorType: string;
    errorMessage: string;
  };
  timestamp: Date;
}

// =============================================================================
// Flow Events
// =============================================================================

export interface FlowMatchedEvent {
  sessionId: string;
  flowId: string;
  flowName: string;
  matchType: 'keyword' | 'pattern';
  matchedOn: string;
  timestamp: Date;
}

export interface FlowNotFoundEvent {
  sessionId: string;
  userRequest: string;
  availableFlows: Array<{ id: string; name: string }>;
  timestamp: Date;
}

// =============================================================================
// System Events
// =============================================================================

export interface SystemErrorEvent {
  sessionId?: string;
  phaseId?: string;
  error: Error;
  severity: 'warning' | 'error' | 'critical';
  timestamp: Date;
}

export interface SystemCleanupEvent {
  sessionsCleaned: number;
  bytesFreed: number;
  errors: Array<{ sessionId: string; error: string }>;
  timestamp: Date;
}