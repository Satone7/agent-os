/**
 * /input interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Send input to running sub-agent
 */
export class InputCommand implements IInteractiveCommand {
  readonly name = '/input';
  readonly description = 'Send input to the sub-agent';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      if (!context.input) {
        return {
          success: false,
          message: 'Usage: /input <your message>',
          continue: true,
        };
      }

      if (!context.services.spawner) {
        return {
          success: false,
          message: 'No active sub-agent to receive input',
          continue: true,
        };
      }

      // Get current process ID (would need to be tracked in context)
      // For now, we'll need to extend the context to include this
      const processId = (context as unknown as { processId?: string }).processId;
      if (!processId) {
        return {
          success: false,
          message: 'No active process found',
          continue: true,
        };
      }

      await context.services.spawner.sendInput(processId, context.input);

      // Increment user interventions counter
      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as { userInterventions: number };
      session.userInterventions += 1;
      await context.services.sessionManager.saveState(session);

      return {
        success: true,
        message: `✅ Input sent to sub-agent. It will be processed in the next time slice.`,
        continue: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send input: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}