/**
 * Loop detection algorithm
 */

import type { ConversationMessage } from '../contracts.js';

export interface LoopDetectionResult {
  isLoop: boolean;
  score: number;
  repeatedActions: string[];
  suggestions: string[];
}

/**
 * Detect if sub-agent is stuck in a loop
 */
export function detectLoop(messages: ConversationMessage[]): LoopDetectionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  if (assistantMessages.length < 3) {
    return {
      isLoop: false,
      score: 0,
      repeatedActions: [],
      suggestions: [],
    };
  }

  // Extract action signatures
  const actions = assistantMessages.map((m) => ({
    content: normalizeContent(m.content),
    toolCalls: (m.toolCalls ?? []).map((tc) => tc.name),
  }));

  // Find repeated content
  const contentCounts = new Map<string, number>();
  for (const action of actions) {
    contentCounts.set(action.content, (contentCounts.get(action.content) ?? 0) + 1);
  }

  const repeatedContent = Array.from(contentCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([content, count]) => ({ content, count }));

  // Find repeated tool call patterns
  const toolPatterns = new Map<string, number>();
  for (const action of actions) {
    const pattern = action.toolCalls.join(',');
    toolPatterns.set(pattern, (toolPatterns.get(pattern) ?? 0) + 1);
  }

  const repeatedPatterns = Array.from(toolPatterns.entries())
    .filter(([_, count]) => count >= 3 && _ !== '')
    .map(([pattern, count]) => ({ pattern, count }));

  // Calculate loop score
  const maxRepeats = Math.max(
    ...repeatedContent.map((r) => r.count),
    ...repeatedPatterns.map((r) => r.count),
    0
  );

  const score = Math.min((maxRepeats - 2) * 0.25, 1);

  const isLoop = score > 0.5;

  const suggestions: string[] = [];
  if (isLoop) {
    suggestions.push('Try breaking the loop by providing alternative approach');
    suggestions.push('Consider skipping this phase and moving on');
    suggestions.push('Provide more specific guidance to the sub-agent');
  }

  return {
    isLoop,
    score,
    repeatedActions: repeatedContent.map((r) => r.content).slice(0, 5),
    suggestions,
  };
}

/**
 * Normalize content for comparison
 */
function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .slice(0, 200);
}