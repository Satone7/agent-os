/**
 * /skip interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Skip current phase
 */
export class SkipCommand implements IInteractiveCommand {
  readonly name = '/skip';
  readonly description = 'Skip the current phase';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      if (!context.currentPhase) {
        return {
          success: false,
          message: 'No active phase to skip',
          continue: true,
        };
      }

      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as {
        currentPhase: string;
        currentPhaseIndex: number;
        phaseStatus: Record<string, unknown>;
      };

      await context.services.sessionManager.updatePhaseStatus(
        context.sessionId,
        context.currentPhase,
        { status: 'skipped' }
      );

      // Move to next phase
      const phaseIds = Object.keys(session.phaseStatus);
      const nextIndex = session.currentPhaseIndex + 1;

      if (nextIndex < phaseIds.length) {
        session.currentPhaseIndex = nextIndex;
        session.currentPhase = phaseIds[nextIndex]!;
        await context.services.sessionManager.saveState(session);

        return {
          success: true,
          message: `⏭️ Phase "${context.currentPhase}" skipped. Moving to next phase.`,
          continue: true,
        };
      } else {
        // All phases done
        return {
          success: true,
          message: `⏭️ Phase "${context.currentPhase}" skipped. All phases complete!`,
          continue: false,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to skip: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}