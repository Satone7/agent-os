/**
 * Flow Engine Module Contracts
 *
 * These interfaces define the boundaries of the flow engine module,
 * which handles loading, validation, and matching of flow definitions.
 */

import type { Flow, Phase, FlowTrigger } from '../data-model';

/**
 * Flow definition loader
 */
export interface IFlowLoader {
  /**
   * Load a flow by ID
   * @param flowId - Flow identifier
   * @returns Flow definition
   * @throws FlowNotFoundError if flow doesn't exist
   * @throws FlowValidationError if flow is invalid
   */
  loadFlow(flowId: string): Promise<Flow>;

  /**
   * List all available flows
   * @returns Array of flow metadata
   */
  listFlows(): Promise<FlowMeta[]>;

  /**
   * Match a user request to a flow
   * @param userRequest - Natural language request
   * @returns Best matching flow, or null if no match
   */
  matchFlow(userRequest: string): Promise<Flow | null>;

  /**
   * Reload flows from configured paths
   * Useful after adding new flow files
   */
  reload(): Promise<void>;

  /**
   * Get all configured flow paths
   * @returns Array of directory paths
   */
  getFlowPaths(): string[];
}

/**
 * Flow metadata (lightweight for listing)
 */
export interface FlowMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string; // Source file path
}

/**
 * Flow schema validator
 */
export interface IFlowValidator {
  /**
   * Validate a flow definition
   * @param flow - Flow to validate
   * @returns Validation result
   */
  validate(flow: unknown): ValidationResult;

  /**
   * Validate a flow file
   * @param filePath - Path to YAML file
   * @returns Validation result with parsed flow if valid
   */
  validateFile(filePath: string): Promise<FileValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * File validation result
 */
export interface FileValidationResult extends ValidationResult {
  flow?: Flow;
  filePath: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string; // JSON path to error
  message: string;
  value?: unknown;
}

/**
 * Flow trigger matcher
 */
export interface ITriggerMatcher {
  /**
   * Check if a request matches a trigger
   * @param trigger - Flow trigger definition
   * @param userRequest - User request text
   * @returns Match result with score
   */
  match(trigger: FlowTrigger, userRequest: string): MatchResult;

  /**
   * Find best matching flow
   * @param flows - Available flows with triggers
   * @param userRequest - User request text
   * @returns Best match or null
   */
  findBestMatch(flows: Flow[], userRequest: string): Flow | null;
}

/**
 * Trigger match result
 */
export interface MatchResult {
  matched: boolean;
  score: number; // Higher is better match
  matchType: 'keyword' | 'pattern' | 'none';
  matchedOn?: string; // The keyword or pattern that matched
}

/**
 * Phase executor
 */
export interface IPhaseExecutor {
  /**
   * Prepare phase for execution
   * @param phase - Phase to prepare
   * @param sessionId - Session context
   * @returns Preparation result with resolved paths
   */
  prepare(phase: Phase, sessionId: string): Promise<PhasePreparation>;

  /**
   * Resolve prompt template with context
   * @param templatePath - Path to prompt template
   * @param context - Template context variables
   * @returns Resolved prompt string
   */
  resolvePrompt(templatePath: string, context: PromptContext): Promise<string>;

  /**
   * Validate phase outputs
   * @param workspacePath - Sub-agent workspace
   * @param expectedOutputs - Expected output patterns
   * @returns Validation result
   */
  validateOutputs(
    workspacePath: string,
    expectedOutputs: string[]
  ): Promise<OutputValidationResult>;
}

/**
 * Phase preparation result
 */
export interface PhasePreparation {
  phaseId: string;
  workspacePath: string;
  resolvedPrompt: string;
  model: string;
  skills: string[];
  tools: string[];
  env: Record<string, string>;
}

/**
 * Prompt template context
 */
export interface PromptContext {
  userRequest: string;
  sessionId: string;
  phaseName: string;
  previousPhaseOutputs: Record<string, string[]>;
  clarifications?: Array<{ question: string; answer: string }>;
}

/**
 * Output validation result
 */
export interface OutputValidationResult {
  valid: boolean;
  foundFiles: string[];
  missingPatterns: string[];
}

/**
 * Errors
 */
export class FlowNotFoundError extends Error {
  constructor(public readonly flowId: string) {
    super(`Flow not found: ${flowId}`);
    this.name = 'FlowNotFoundError';
  }
}

export class FlowValidationError extends Error {
  constructor(
    public readonly flowId: string,
    public readonly errors: ValidationError[]
  ) {
    super(`Flow validation failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'FlowValidationError';
  }
}

export class PromptTemplateError extends Error {
  constructor(
    public readonly templatePath: string,
    public readonly reason: string
  ) {
    super(`Prompt template error: ${templatePath} - ${reason}`);
    this.name = 'PromptTemplateError';
  }
}