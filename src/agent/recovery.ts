/**
 * Recovery logic for failed phases
 */

import type { PhaseError } from '../types/index.js';

export interface RecoveryDecision {
  action: 'retry' | 'retry_with_adjustment' | 'skip' | 'ask_user' | 'abort';
  adjustedPrompt?: string;
  question?: string;
  options?: string[];
  reason: string;
}

export interface RecoveryContext {
  sessionId: string;
  phaseId: string;
  error: PhaseError;
  retryCount: number;
  maxRetries: number;
  totalRetries: number;
  maxTotalRetries: number;
  diagnosis?: {
    status: string;
    indicators: string[];
  };
}

/**
 * Decide on recovery action for a failed phase
 */
export function decideRecovery(context: RecoveryContext): RecoveryDecision {
  const { error, retryCount, maxRetries, totalRetries, maxTotalRetries, diagnosis } = context;

  // Check total retry limit
  if (totalRetries >= maxTotalRetries) {
    return {
      action: 'abort',
      reason: `Total retry limit (${maxTotalRetries}) exceeded`,
    };
  }

  // Check phase retry limit
  if (retryCount >= maxRetries) {
    return {
      action: 'ask_user',
      reason: `Phase retry limit (${maxRetries}) exceeded`,
      question: `Phase "${context.phaseId}" has failed ${retryCount} times. What would you like to do?`,
      options: ['Retry with adjusted approach', 'Skip this phase', 'Abort session'],
    };
  }

  // Decide based on error type
  switch (error.type) {
    case 'stuck_in_loop':
      return {
        action: 'retry_with_adjustment',
        reason: 'Sub-agent was stuck in a loop',
        adjustedPrompt: generateLoopBreakPrompt(diagnosis),
      };

    case 'blocked':
      return {
        action: 'ask_user',
        reason: 'Sub-agent is blocked and needs guidance',
        question: `The sub-agent appears to be blocked: ${error.message}. How would you like to proceed?`,
        options: ['Provide guidance', 'Retry', 'Skip'],
      };

    case 'timeout':
      return {
        action: 'retry',
        reason: 'Phase timed out, will retry with fresh context',
      };

    case 'crash':
      if (retryCount < 2) {
        return {
          action: 'retry',
          reason: 'Sub-agent crashed, will retry',
        };
      }
      return {
        action: 'ask_user',
        reason: 'Sub-agent crashed multiple times',
        question: 'The sub-agent keeps crashing. What would you like to do?',
        options: ['Retry', 'Skip', 'Abort'],
      };

    case 'startup_failed':
      return {
        action: 'ask_user',
        reason: 'Failed to start sub-agent',
        question: 'Could not start the sub-agent process. Check if Claude CLI is available.',
        options: ['Retry', 'Skip', 'Abort'],
      };

    case 'output_validation_failed':
      return {
        action: 'retry_with_adjustment',
        reason: 'Output validation failed',
        adjustedPrompt: 'Please ensure all required output files are created correctly.',
      };

    default:
      return {
        action: 'retry',
        reason: `Unknown error type: ${String(error.type)}`,
      };
  }
}

/**
 * Generate prompt to break out of a loop
 */
function generateLoopBreakPrompt(diagnosis?: { status: string; indicators: string[] }): string {
  const indicators = diagnosis?.indicators ?? [];

  return `
⚠️ Loop Detection Notice

You appear to be repeating similar actions. Previous attempts:
${indicators.map((i) => `- ${i}`).join('\n')}

Please try a different approach:
1. Break down the task into smaller steps
2. Use different tools or methods
3. Ask for clarification if requirements are unclear
4. Focus on making progress, not perfection
`;
}