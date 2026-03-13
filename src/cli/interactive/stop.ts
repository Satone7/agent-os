/**
 * /stop interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Stop the session
 */
export class StopCommand implements IInteractiveCommand {
  readonly name = '/stop';
  readonly description = 'Stop the current session';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as { state: string; currentPhase?: string };

      // Kill any running sub-agent
      if (context.services.spawner && context.currentPhase) {
        const processId = (context as unknown as { processId?: string }).processId;
        if (processId) {
          await context.services.spawner.kill(processId, true);
        }
      }

      session.state = 'stopped';
      await context.services.sessionManager.saveState(session);

      return {
        success: true,
        message: `⏹️ Session stopped.`,
        continue: false,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}