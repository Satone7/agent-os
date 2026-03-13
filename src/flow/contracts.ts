/**
 * Flow Engine Module Contracts
 */

import type { ValidationError } from '../types/errors.js';
import type { Flow, Phase, FlowTrigger } from '../types/index.js';

/**
 * Flow definition loader
 */
export interface IFlowLoader {
  loadFlow(flowId: string): Promise<Flow>;
  listFlows(): Promise<FlowMeta[]>;
  matchFlow(userRequest: string): Promise<Flow | null>;
  reload(): Promise<void>;
  addFlowPath(path: string): void;
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
  path: string;
}

/**
 * Flow schema validator
 */
export interface IFlowValidator {
  validate(flow: unknown): ValidationResult;
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
 * Flow trigger matcher
 */
export interface ITriggerMatcher {
  match(trigger: FlowTrigger, userRequest: string): MatchResult;
  matchFlow(flows: Flow[], userRequest: string): Flow | null;
  calculateMatchScore(
    flow: Flow,
    userRequest: string,
    matchType: 'keyword' | 'pattern' | 'none',
    matchedOn?: string
  ): number;
}

/**
 * Trigger match result
 */
export interface MatchResult {
  matched: boolean;
  score: number;
  matchType: 'keyword' | 'pattern' | 'none';
  matchedOn?: string;
}

/**
 * Phase executor
 */
export interface IPhaseExecutor {
  prepare(phase: Phase, sessionId: string): Promise<PhasePreparation>;
  resolvePrompt(templatePath: string, context: PromptContext): Promise<string>;
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