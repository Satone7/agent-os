/**
 * Unit tests for flow matching
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowMatcher } from '../../../src/agent/flow-matcher.js';
import type { Flow } from '../../../src/types/index.js';

describe('FlowMatcher', () => {
  let matcher: FlowMatcher;
  let sampleFlows: Flow[];

  beforeEach(() => {
    matcher = new FlowMatcher();
    sampleFlows = [
      {
        id: 'software-development',
        name: 'Software Development',
        version: '1.0.0',
        description: 'Full software development workflow',
        trigger: {
          keywords: ['develop', 'build', 'create app', 'implement'],
          patterns: ['build (a )?(todo|app|application|system)', 'develop (a )?.*'],
        },
        phases: [],
        settings: {
          defaultModel: 'claude-sonnet-4-6',
          failurePolicy: {
            maxTotalRetries: 10,
            userNotifyThreshold: 3,
          },
        },
      },
      {
        id: 'research-report',
        name: 'Research Report',
        version: '1.0.0',
        description: 'Research and report generation workflow',
        trigger: {
          keywords: ['research', 'report', 'analyze', 'investigate'],
          patterns: ['research (on|about)? .+', 'write (a )?report'],
        },
        phases: [],
        settings: {
          defaultModel: 'claude-sonnet-4-6',
          failurePolicy: {
            maxTotalRetries: 5,
            userNotifyThreshold: 2,
          },
        },
      },
    ];
  });

  describe('matchFlow', () => {
    it('should match by keyword', async () => {
      const result = await matcher.matchFlow(sampleFlows, 'I want to develop a todo app');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('software-development');
    });

    it('should match by pattern', async () => {
      const result = await matcher.matchFlow(sampleFlows, 'build a todo');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('software-development');
    });

    it('should return null when no match', async () => {
      const result = await matcher.matchFlow(sampleFlows, 'hello world');
      expect(result).toBeNull();
    });

    it('should prioritize pattern match over keyword match', async () => {
      const result = await matcher.matchFlow(sampleFlows, 'research about AI');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('research-report');
    });

    it('should match multiple keywords and pick best score', async () => {
      const result = await matcher.matchFlow(
        sampleFlows,
        'I want to develop and build a new application'
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe('software-development');
    });
  });

  describe('calculateMatchScore', () => {
    it('should return higher score for pattern match', () => {
      const flow = sampleFlows[0]!;
      const patternScore = matcher.calculateMatchScore(
        flow,
        'build a todo app',
        'pattern',
        'build (a )?(todo|app|application|system)'
      );
      const keywordScore = matcher.calculateMatchScore(
        flow,
        'I want to develop something',
        'keyword',
        'develop'
      );
      expect(patternScore).toBeGreaterThan(keywordScore);
    });

    it('should return 0 for no match type', () => {
      const score = matcher.calculateMatchScore(
        sampleFlows[0]!,
        'test',
        'none',
        undefined
      );
      expect(score).toBe(0);
    });
  });
});