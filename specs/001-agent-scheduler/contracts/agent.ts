/**
 * Agent Runtime Module Contracts
 *
 * These interfaces define the boundaries of the agent runtime module,
 * which handles spawning, diagnosis, and control of sub-agents.
 */

import type { DiagnosticResult, PhaseError } from '../data-model';

/**
 * Sub-agent process spawner
 */
export interface ISpawner {
  /**
   * Spawn a new sub-agent process
   * @param config - Spawn configuration
   * @returns Process handle
   * @throws SubAgentSpawnError if Claude CLI not available
   */
  spawn(config: SubAgentSpawnConfig): Promise<SubAgentProcess>;

  /**
   * Check if a process is still alive
   * @param processId - Process ID
   * @returns true if process is running
   */
  isAlive(processId: string): Promise<boolean>;

  /**
   * Terminate a sub-agent process
   * @param processId - Process ID
   * @param force - Use SIGKILL instead of SIGTERM
   */
  kill(processId: string, force?: boolean): Promise<void>;

  /**
   * Send input to a running sub-agent
   * @param processId - Process ID
   * @param input - User input text
   */
  sendInput(processId: string, input: string): Promise<void>;

  /**
   * Wait for process to exit
   * @param processId - Process ID
   * @param timeout - Max wait time in milliseconds
   * @returns Exit code or null if timeout
   */
  waitForExit(processId: string, timeout?: number): Promise<number | null>;
}

/**
 * Configuration for spawning a sub-agent
 */
export interface SubAgentSpawnConfig {
  /** Path to workspace directory */
  workspacePath: string;
  /** Initial prompt to send via stdin */
  prompt: string;
  /** Model override (optional) */
  model?: string;
  /** Skills to preload */
  skills?: string[];
  /** Tools to allow (empty = all) */
  tools?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Phase ID for tracking */
  phaseId: string;
}

/**
 * Runtime sub-agent process handle
 */
export interface SubAgentProcess {
  /** Unique process identifier */
  id: string;
  /** Operating system PID */
  pid: number;
  /** Phase this process is executing */
  phaseId: string;
  /** Workspace path */
  workspacePath: string;
  /** Path to Claude conversation file */
  conversationPath: string;
  /** Spawn timestamp */
  startTime: Date;
  /** Current status */
  status: SubAgentStatus;
}

export type SubAgentStatus = 'spawning' | 'running' | 'paused' | 'terminated';

/**
 * Sub-agent status diagnostician
 */
export interface IDiagnostician {
  /**
   * Analyze sub-agent conversation to determine status
   * @param conversationPath - Path to conversation.jsonl
   * @returns Diagnostic result with confidence score
   */
  diagnose(conversationPath: string): Promise<DiagnosticResult>;

  /**
   * Detect if sub-agent is stuck in a loop
   * @param messages - Recent messages from conversation
   * @returns Loop detection score (0-1, >0.7 = stuck)
   */
  detectLoop(messages: ConversationMessage[]): number;

  /**
   * Detect if sub-agent is blocked
   * @param messages - Recent messages from conversation
   * @returns Block detection score (0-1, >0.6 = blocked)
   */
  detectBlock(messages: ConversationMessage[]): number;

  /**
   * Detect completion signals
   * @param messages - Recent messages from conversation
   * @param expectedOutputs - Expected output file patterns
   * @returns Completion detection score (0-1, >0.8 = complete)
   */
  detectCompletion(
    messages: ConversationMessage[],
    expectedOutputs: string[]
  ): Promise<number>;
}

/**
 * Parsed conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

/**
 * Tool call record
 */
export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

/**
 * Main agent controller
 */
export interface IController {
  /**
   * Run the main agent loop for a session
   * @param sessionId - Session to control
   */
  run(sessionId: string): Promise<void>;

  /**
   * Make a decision based on current context
   * @param context - Current agent context
   * @returns Decision on next action
   */
  makeDecision(context: MainAgentContext): Promise<Decision>;

  /**
   * Generate recovery strategy for a failed phase
   * @param error - Phase error
   * @param context - Current context
   * @returns Recovery decision
   */
  decideRecovery(error: PhaseError, context: MainAgentContext): Promise<RecoveryDecision>;
}

/**
 * Main agent runtime context
 */
export interface MainAgentContext {
  sessionId: string;
  userRequest: string;
  currentPhaseIndex: number;
  phaseStatus: Map<string, PhaseRuntimeStatus>;
  activeSubAgent: SubAgentProcess | null;
  decisionHistory: Decision[];
}

/**
 * Phase runtime status
 */
export interface PhaseRuntimeStatus {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  retryCount: number;
  startTime?: Date;
  error?: PhaseError;
}

/**
 * Controller decision
 */
export interface Decision {
  action: DecisionAction;
  params?: DecisionParams;
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

export interface DecisionParams {
  phaseId?: string;
  timeSlice?: string;
  adjustedPrompt?: string;
  question?: string;
  options?: string[];
}

/**
 * Recovery decision for failed phases
 */
export interface RecoveryDecision {
  action: 'retry' | 'retry_with_adjustment' | 'skip' | 'ask_user' | 'abort';
  params?: {
    adjustedPrompt?: string;
    question?: string;
    options?: string[];
  };
}

/**
 * Errors
 */
export class SubAgentSpawnError extends Error {
  constructor(
    public readonly reason: 'claude_cli_not_found' | 'workspace_error' | 'permission_denied',
    message: string
  ) {
    super(message);
    this.name = 'SubAgentSpawnError';
  }
}

export class SubAgentTimeoutError extends Error {
  constructor(
    public readonly processId: string,
    public readonly duration: number
  ) {
    super(`Sub-agent ${processId} timed out after ${duration}ms`);
    this.name = 'SubAgentTimeoutError';
  }
}