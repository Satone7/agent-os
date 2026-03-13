/**
 * Phase type definitions
 */

/**
 * A single step within a flow
 */
export interface Phase {
  /** Unique phase identifier (kebab-case) */
  id: string;
  /** Human-readable phase name */
  name: string;
  /** Brief description of phase purpose */
  description: string;
  /** Sub-agent configuration */
  agent: AgentConfig;
  /** Monitoring interval settings */
  timeSlice?: TimeSliceConfig;
  /** Expected output file patterns (glob) */
  outputs: string[];
  /** Phase behavior settings */
  config: PhaseConfig;
}

/**
 * Configuration for spawning a sub-agent
 */
export interface AgentConfig {
  /** Model override (defaults to flow setting) */
  model?: string;
  /** Path to prompt template file */
  promptTemplate: string;
  /** Pre-loaded skills for sub-agent */
  skills?: string[];
  /** Allowed tools (empty = all allowed) */
  tools?: string[];
  /** Environment variables for sub-agent */
  env?: Record<string, string>;
}

/**
 * Time-slice monitoring settings
 */
export interface TimeSliceConfig {
  /** Default check interval (e.g., "10m", "1h") */
  default: string;
  /** Maximum runtime before termination */
  max?: string;
}

/**
 * Phase behavior configuration
 */
export interface PhaseConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Allow user to skip this phase */
  allowSkip?: boolean;
  /** Require user approval before next phase */
  requireUserConfirm?: boolean;
}