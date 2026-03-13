/**
 * /resume interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Resume paused phase
 */
export class ResumeCommand implements IInteractiveCommand {
  readonly name = '/resume';
  readonly description = 'Resume a paused phase';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as {
        state: string;
        currentPhase: string;
        phaseStatus: Record<string, { status: string }>;
      };

      if (session.state !== 'paused') {
        return {
          success: false,
          message: 'Session is not paused',
          continue: true,
        };
      }

      // Find paused phase
      const pausedPhase = Object.entries(session.phaseStatus).find(
        ([_, status]) => status.status === 'paused'
      );

      if (!pausedPhase) {
        return {
          success: false,
          message: 'No paused phase found',
          continue: true,
        };
      }

      const [phaseId] = pausedPhase;

      await context.services.sessionManager.updatePhaseStatus(
        context.sessionId,
        phaseId,
        { status: 'running' }
      );

      session.state = 'running';
      await context.services.sessionManager.saveState(session);

      return {
        success: true,
        message: `▶️ Phase "${phaseId}" resumed.`,
        continue: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to resume: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}