/**
 * Error type definitions
 */

/**
 * Base error class for Agent-OS
 */
export class AgentOSError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AgentOSError';
  }
}

/**
 * Session not found error
 */
export class SessionNotFoundError extends AgentOSError {
  constructor(public readonly sessionId: string) {
    super(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND');
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Session state error
 */
export class SessionStateError extends AgentOSError {
  constructor(
    public readonly sessionId: string,
    public readonly currentState: string,
    public readonly expectedStates: string[]
  ) {
    super(
      `Invalid session state: ${currentState}. Expected: ${expectedStates.join(', ')}`,
      'SESSION_STATE_ERROR'
    );
    this.name = 'SessionStateError';
  }
}

/**
 * Flow not found error
 */
export class FlowNotFoundError extends AgentOSError {
  constructor(public readonly flowId: string) {
    super(`Flow not found: ${flowId}`, 'FLOW_NOT_FOUND');
    this.name = 'FlowNotFoundError';
  }
}

/**
 * Flow validation error
 */
export class FlowValidationError extends AgentOSError {
  constructor(
    public readonly flowId: string,
    public readonly errors: ValidationError[]
  ) {
    super(
      `Flow validation failed: ${errors.map((e) => e.message).join(', ')}`,
      'FLOW_VALIDATION_ERROR'
    );
    this.name = 'FlowValidationError';
  }
}

/**
 * Validation error
 */
export interface ValidationError {
  /** JSON path to error */
  path: string;
  /** Error message */
  message: string;
  /** Invalid value */
  value?: unknown;
}

/**
 * Sub-agent spawn error
 */
export class SubAgentSpawnError extends AgentOSError {
  constructor(
    public readonly reason:
      | 'claude_cli_not_found'
      | 'workspace_error'
      | 'permission_denied',
    message: string
  ) {
    super(message, 'SUBAGENT_SPAWN_ERROR');
    this.name = 'SubAgentSpawnError';
  }
}

/**
 * Sub-agent timeout error
 */
export class SubAgentTimeoutError extends AgentOSError {
  constructor(
    public readonly processId: string,
    public readonly duration: number
  ) {
    super(
      `Sub-agent ${processId} timed out after ${duration}ms`,
      'SUBAGENT_TIMEOUT'
    );
    this.name = 'SubAgentTimeoutError';
  }
}

/**
 * Workspace error
 */
export class WorkspaceError extends AgentOSError {
  constructor(
    public readonly sessionId: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(
      `Workspace error for ${sessionId}: ${operation}`,
      'WORKSPACE_ERROR'
    );
    this.name = 'WorkspaceError';
  }
}

/**
 * Disk full error
 */
export class DiskFullError extends AgentOSError {
  constructor(
    public readonly requiredBytes: number,
    public readonly availableBytes: number
  ) {
    super(
      `Disk full: need ${requiredBytes}, have ${availableBytes}`,
      'DISK_FULL'
    );
    this.name = 'DiskFullError';
  }
}

/**
 * Prompt template error
 */
export class PromptTemplateError extends AgentOSError {
  constructor(
    public readonly templatePath: string,
    public readonly reason: string
  ) {
    super(
      `Prompt template error: ${templatePath} - ${reason}`,
      'PROMPT_TEMPLATE_ERROR'
    );
    this.name = 'PromptTemplateError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AgentOSError {
  constructor(
    public readonly configPath: string,
    public readonly reason: string
  ) {
    super(
      `Configuration error at ${configPath}: ${reason}`,
      'CONFIGURATION_ERROR'
    );
    this.name = 'ConfigurationError';
  }
}