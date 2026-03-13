/**
 * Flow matcher implementation
 */

import type { ITriggerMatcher, MatchResult } from '../flow/contracts.js';
import type { Flow, FlowTrigger } from '../types/index.js';

/**
 * Flow matcher implementation
 */
export class FlowMatcher implements ITriggerMatcher {
  /**
   * Check if a request matches a trigger
   */
  match(trigger: FlowTrigger, userRequest: string): MatchResult {
    const lowerRequest = userRequest.toLowerCase();

    // Try pattern matching first (more specific)
    if (trigger.patterns) {
      for (const pattern of trigger.patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(userRequest)) {
            return {
              matched: true,
              score: this.calculatePatternScore(pattern),
              matchType: 'pattern',
              matchedOn: pattern,
            };
          }
        } catch {
          // Invalid regex, skip
        }
      }
    }

    // Try keyword matching
    for (const keyword of trigger.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerRequest.includes(lowerKeyword)) {
        return {
          matched: true,
          score: this.calculateKeywordScore(keyword, userRequest),
          matchType: 'keyword',
          matchedOn: keyword,
        };
      }
    }

    return {
      matched: false,
      score: 0,
      matchType: 'none',
    };
  }

  /**
   * Find best matching flow
   */
  matchFlow(flows: Flow[], userRequest: string): Flow | null {
    let bestMatch: Flow | null = null;
    let bestScore = 0;

    for (const flow of flows) {
      const result = this.match(flow.trigger, userRequest);
      if (result.matched && result.score > bestScore) {
        bestMatch = flow;
        bestScore = result.score;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score for a flow
   */
  calculateMatchScore(
    _flow: Flow,
    _userRequest: string,
    matchType: 'keyword' | 'pattern' | 'none',
    matchedOn?: string
  ): number {
    switch (matchType) {
      case 'pattern':
        return this.calculatePatternScore(matchedOn ?? '');
      case 'keyword':
        return this.calculateKeywordScore(matchedOn ?? '', _userRequest);
      default:
        return 0;
    }
  }

  /**
   * Calculate score for pattern match
   */
  private calculatePatternScore(pattern: string): number {
    // Longer, more specific patterns get higher scores
    const baseScore = 70;
    const lengthBonus = Math.min(pattern.length / 10, 20);
    return Math.round(baseScore + lengthBonus);
  }

  /**
   * Calculate score for keyword match
   */
  private calculateKeywordScore(keyword: string, userRequest: string): number {
    const baseScore = 50;
    // Longer keywords get higher scores
    const lengthBonus = keyword.length * 2;
    // Exact word match bonus
    const words = userRequest.toLowerCase().split(/\s+/);
    const exactMatch = words.includes(keyword.toLowerCase());
    const exactBonus = exactMatch ? 10 : 0;

    return Math.min(baseScore + lengthBonus + exactBonus, 69);
  }
}