/**
 * Flow type definitions
 */

import type { Phase } from './phase.js';

/**
 * A predefined workflow template
 */
export interface Flow {
  /** Unique flow identifier (kebab-case) */
  id: string;
  /** Human-readable flow name */
  name: string;
  /** Semantic version */
  version: string;
  /** Brief description of the flow */
  description: string;
  /** Matching conditions */
  trigger: FlowTrigger;
  /** Ordered list of phases (sequential) */
  phases: Phase[];
  /** Flow-level configuration */
  settings: FlowSettings;
}

/**
 * Conditions for matching user requests to flows
 */
export interface FlowTrigger {
  /** Keywords that trigger this flow */
  keywords: string[];
  /** Regex patterns for matching */
  patterns?: string[];
}

/**
 * Flow-level settings
 */
export interface FlowSettings {
  /** Default model for all phases */
  defaultModel: string;
  /** Retry and notification settings */
  failurePolicy: FailurePolicy;
}

/**
 * Flow-level failure handling
 */
export interface FailurePolicy {
  /** Maximum retries across entire flow */
  maxTotalRetries: number;
  /** Notify user after N consecutive failures */
  userNotifyThreshold: number;
}