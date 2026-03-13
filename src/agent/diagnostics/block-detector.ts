/**
 * Block detection algorithm
 */

import type { ConversationMessage } from '../contracts.js';

export interface BlockDetectionResult {
  isBlocked: boolean;
  score: number;
  blockers: string[];
  suggestions: string[];
}

/**
 * Common error patterns that indicate blocking
 */
const ERROR_PATTERNS = [
  /error[:：]\s*(.+)/i,
  /failed[:：]\s*(.+)/i,
  /cannot\s+(.+)/i,
  /unable\s+to\s+(.+)/i,
  /not\s+found[:：]?\s*(.+)/i,
  /permission\s+denied/i,
  /timeout/i,
  /invalid\s+(.+)/i,
  /unexpected\s+(.+)/i,
];

/**
 * Detect if sub-agent is blocked
 */
export function detectBlock(messages: ConversationMessage[]): BlockDetectionResult {
  const recentMessages = messages.slice(-15);

  const blockers: string[] = [];
  let errorCount = 0;

  for (const msg of recentMessages) {
    const content = msg.content;

    for (const pattern of ERROR_PATTERNS) {
      const match = pattern.exec(content);
      if (match) {
        errorCount++;
        blockers.push(match[1]?.trim() ?? match[0]);
      }
    }
  }

  // Remove duplicates
  const uniqueBlockers = [...new Set(blockers)].slice(0, 5);

  // Calculate block score
  const score = Math.min(errorCount / 4, 1);
  const isBlocked = score > 0.5;

  const suggestions: string[] = [];
  if (isBlocked) {
    if (uniqueBlockers.some((b) => b.toLowerCase().includes('permission'))) {
      suggestions.push('Check file permissions or authentication');
    }
    if (uniqueBlockers.some((b) => b.toLowerCase().includes('not found'))) {
      suggestions.push('Verify the file or resource exists');
    }
    if (uniqueBlockers.some((b) => b.toLowerCase().includes('timeout'))) {
      suggestions.push('Increase timeout or check network connectivity');
    }
    suggestions.push('Consider providing alternative approach');
    suggestions.push('Ask user for guidance');
  }

  return {
    isBlocked,
    score,
    blockers: uniqueBlockers,
    suggestions,
  };
}