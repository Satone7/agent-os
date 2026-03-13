/**
 * Completion detection algorithm
 */

import fg from 'fast-glob';

import type { ConversationMessage } from '../contracts.js';

export interface CompletionDetectionResult {
  isComplete: boolean;
  score: number;
  indicators: string[];
  missingOutputs: string[];
}

/**
 * Completion indicators in conversation
 */
const COMPLETION_INDICATORS = [
  /task\s+(is\s+)?complet/i,
  /i\s+have\s+(successfully\s+)?complet/i,
  /all\s+(tasks?\s+)?done/i,
  /finished\s+(implementing|writing|creating)/i,
  /here\s+is\s+the\s+(final\s+)?result/i,
  /successfully\s+created/i,
];

/**
 * Detect if sub-agent has completed its task
 */
export async function detectCompletion(
  messages: ConversationMessage[],
  expectedOutputs: string[],
  workspacePath?: string
): Promise<CompletionDetectionResult> {
  const indicators: string[] = [];
  let score = 0;

  // Check conversation for completion indicators
  const lastAssistant = messages
    .filter((m) => m.role === 'assistant')
    .pop();

  if (lastAssistant) {
    for (const pattern of COMPLETION_INDICATORS) {
      if (pattern.test(lastAssistant.content)) {
        indicators.push(`Completion indicator: "${pattern.source}"`);
        score += 0.3;
        break;
      }
    }
  }

  // Check for output files
  const missingOutputs: string[] = [];
  if (workspacePath !== undefined && workspacePath !== '' && expectedOutputs.length > 0) {
    for (const pattern of expectedOutputs) {
      try {
        const files = await fg(pattern, { cwd: workspacePath });
        if (files.length > 0) {
          indicators.push(`Output found: ${pattern}`);
          score += 0.2;
        } else {
          missingOutputs.push(pattern);
        }
      } catch {
        missingOutputs.push(pattern);
      }
    }
  }

  // Normalize score
  score = Math.min(score, 1);

  const isComplete = score >= 0.6 && missingOutputs.length === 0;

  return {
    isComplete,
    score,
    indicators,
    missingOutputs,
  };
}