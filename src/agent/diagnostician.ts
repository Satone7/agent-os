/**
 * Diagnostician implementation for sub-agent status diagnosis
 */

import * as fs from 'node:fs/promises';

import { getLogger } from '../logging/logger.js';

import type { IDiagnostician, DiagnosticResult, ConversationMessage } from './contracts.js';

const log = getLogger();

/**
 * Diagnostician implementation
 */
export class Diagnostician implements IDiagnostician {
  /**
   * Analyze sub-agent conversation to determine status
   */
  async diagnose(conversationPath: string): Promise<DiagnosticResult> {
    try {
      const messages = await this.loadConversation(conversationPath);

      if (messages.length === 0) {
        return {
          status: 'unknown',
          confidence: 0.5,
          indicators: ['No conversation history found'],
          recommendation: 'Wait for sub-agent to start',
        };
      }

      // Check for completion
      const completionScore = this.detectCompletion(messages, []);
      if (completionScore > 0.8) {
        return {
          status: 'completed',
          confidence: completionScore,
          indicators: ['Task marked as complete', 'Conversation ended naturally'],
          recommendation: 'Verify outputs and proceed to next phase',
        };
      }

      // Check for loop
      const loopScore = this.detectLoop(messages);
      if (loopScore > 0.7) {
        return {
          status: 'stuck',
          confidence: loopScore,
          indicators: ['Repeated actions detected', 'Similar outputs in sequence'],
          recommendation: 'Break the loop with adjusted prompt or skip phase',
        };
      }

      // Check for block
      const blockScore = this.detectBlock(messages);
      if (blockScore > 0.6) {
        return {
          status: 'blocked',
          confidence: blockScore,
          indicators: ['Repeated errors', 'Multiple failed attempts'],
          recommendation: 'Provide user guidance or retry with adjusted approach',
        };
      }

      // Otherwise healthy
      return {
        status: 'healthy',
        confidence: 0.8,
        indicators: ['Normal progress', 'No issues detected'],
        recommendation: 'Continue monitoring',
      };
    } catch (error) {
      log.error({ conversationPath, error }, 'Failed to diagnose sub-agent');
      return {
        status: 'unknown',
        confidence: 0,
        indicators: [`Diagnosis failed: ${(error as Error).message}`],
        recommendation: 'Check conversation file manually',
      };
    }
  }

  /**
   * Detect if sub-agent is stuck in a loop
   */
  detectLoop(messages: ConversationMessage[]): number {
    if (messages.length < 4) {
      return 0;
    }

    // Get recent assistant messages
    const recentAssistant = messages
      .filter((m) => m.role === 'assistant')
      .slice(-10);

    if (recentAssistant.length < 3) {
      return 0;
    }

    // Check for repeated similar content
    const contents = recentAssistant.map((m) => this.normalizeContent(m.content));
    const uniqueContents = new Set(contents);

    // If more than 50% are duplicates, likely a loop
    const duplicateRatio = 1 - uniqueContents.size / contents.length;

    // Check for repeated tool calls
    const toolCallSignatures = recentAssistant
      .flatMap((m) => m.toolCalls?.map((tc) => `${tc.name}:${JSON.stringify(tc.args)}`) ?? [])
      .slice(-8);

    const uniqueToolCalls = new Set(toolCallSignatures);
    const toolCallDupRatio =
      toolCallSignatures.length > 0
        ? 1 - uniqueToolCalls.size / toolCallSignatures.length
        : 0;

    return Math.max(duplicateRatio, toolCallDupRatio);
  }

  /**
   * Detect if sub-agent is blocked
   */
  detectBlock(messages: ConversationMessage[]): number {
    if (messages.length < 3) {
      return 0;
    }

    // Look for error indicators
    const errorIndicators = [
      'error',
      'failed',
      'cannot',
      'unable to',
      'not found',
      'permission denied',
      'timeout',
    ];

    const recentMessages = messages.slice(-10);
    let errorCount = 0;

    for (const msg of recentMessages) {
      const content = msg.content.toLowerCase();
      for (const indicator of errorIndicators) {
        if (content.includes(indicator)) {
          errorCount++;
        }
      }
    }

    // Normalize to 0-1 range
    return Math.min(errorCount / 5, 1);
  }

  /**
   * Detect completion signals
   */
  detectCompletion(
    messages: ConversationMessage[],
    _expectedOutputs: string[]
  ): number {
    if (messages.length === 0) {
      return 0;
    }

    // Check for completion indicators in last assistant message
    const lastAssistant = messages
      .filter((m) => m.role === 'assistant')
      .pop();

    if (!lastAssistant) {
      return 0;
    }

    const content = lastAssistant.content.toLowerCase();

    const completionIndicators = [
      'task completed',
      'done',
      'finished',
      'i have completed',
      'all tasks are done',
      'successfully completed',
    ];

    for (const indicator of completionIndicators) {
      if (content.includes(indicator)) {
        return 0.9;
      }
    }

    // Check if conversation ended with user acknowledgment pattern
    const lastUser = messages.filter((m) => m.role === 'user').pop();
    if (lastUser?.content.toLowerCase().includes('continue') === true) {
      return 0.3;
    }

    return 0.1;
  }

  /**
   * Load conversation from JSONL file
   */
  private async loadConversation(conversationPath: string): Promise<ConversationMessage[]> {
    try {
      const content = await fs.readFile(conversationPath, 'utf-8');
      const lines = content.trim().split('\n');

      const messages: ConversationMessage[] = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as {
            type: string;
            message?: { role: string; content: string };
            timestamp?: string;
          };

          if (entry.type === 'message' && entry.message) {
            messages.push({
              role: entry.message.role as 'user' | 'assistant' | 'system',
              content: entry.message.content,
              timestamp:
                entry.timestamp !== undefined && entry.timestamp !== ''
                  ? new Date(entry.timestamp)
                  : new Date(),
            });
          }
        } catch {
          // Skip invalid lines
        }
      }

      return messages;
    } catch {
      return [];
    }
  }

  /**
   * Normalize content for comparison
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .slice(0, 100);
  }
}