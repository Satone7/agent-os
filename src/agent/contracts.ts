/**
 * Agent Runtime Module Contracts
 */

/**
 * Sub-agent process spawner
 */
export interface ISpawner {
  spawn(config: SubAgentSpawnConfig): Promise<SubAgentProcess>;
  isAlive(processId: string): Promise<boolean>;
  kill(processId: string, force?: boolean): Promise<void>;
  sendInput(processId: string, input: string): Promise<void>;
  waitForExit(processId: string, timeout?: number): Promise<number | null>;
  getProcess(processId: string): SubAgentProcess | undefined;
}

/**
 * Configuration for spawning a sub-agent
 */
export interface SubAgentSpawnConfig {
  workspacePath: string;
  prompt: string;
  model?: string;
  skills?: string[];
  tools?: string[];
  env?: Record<string, string>;
  phaseId: string;
}

/**
 * Runtime sub-agent process handle
 */
export interface SubAgentProcess {
  id: string;
  pid: number;
  phaseId: string;
  workspacePath: string;
  conversationPath: string;
  startTime: Date;
  status: SubAgentStatus;
}

export type SubAgentStatus = 'spawning' | 'running' | 'paused' | 'terminated';

/**
 * Sub-agent status diagnostician
 */
export interface IDiagnostician {
  diagnose(conversationPath: string): Promise<DiagnosticResult>;
  detectLoop(messages: ConversationMessage[]): number;
  detectBlock(messages: ConversationMessage[]): number;
  detectCompletion(
    messages: ConversationMessage[],
    expectedOutputs: string[]
  ): Promise<number>;
}

/**
 * Diagnostic result
 */
export interface DiagnosticResult {
  status: 'healthy' | 'stuck' | 'blocked' | 'completed' | 'unknown';
  confidence: number;
  indicators: string[];
  recommendation: string;
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