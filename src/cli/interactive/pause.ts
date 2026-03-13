/**
 * /pause interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Pause current phase
 */
export class PauseCommand implements IInteractiveCommand {
  readonly name = '/pause';
  readonly description = 'Pause the current phase';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      if (!context.currentPhase) {
        return {
          success: false,
          message: 'No active phase to pause',
          continue: true,
        };
      }

      await context.services.sessionManager.updatePhaseStatus(
        context.sessionId,
        context.currentPhase,
        { status: 'paused' }
      );

      // Update session state
      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as { state: string };
      session.state = 'paused';
      await context.services.sessionManager.saveState(session);

      return {
        success: true,
        message: `⏸️ Phase "${context.currentPhase}" paused. Use /resume to continue.`,
        continue: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pause: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}