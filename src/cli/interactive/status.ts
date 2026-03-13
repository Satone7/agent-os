/**
 * /status interactive command
 */

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * Show session status
 */
export class StatusCommand implements IInteractiveCommand {
  readonly name = '/status';
  readonly description = 'Show detailed session status';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const session = (await context.services.sessionManager.loadState(
        context.sessionId
      )) as {
        id: string;
        state: string;
        flowName: string;
        currentPhase: string;
        currentPhaseIndex: number;
        userRequest: string;
        phaseStatus: Record<string, { status: string }>;
        totalRetries: number;
        userInterventions: number;
        createdAt: string;
      };

      const lines = [
        `📋 Session Status`,
        ``,
        `ID: ${session.id}`,
        `State: ${session.state}`,
        `Flow: ${session.flowName}`,
        `Current Phase: ${session.currentPhase} (${session.currentPhaseIndex + 1}/${Object.keys(session.phaseStatus).length})`,
        `Request: ${session.userRequest}`,
        ``,
        `Phase Progress:`,
      ];

      const phases = Object.entries(session.phaseStatus);
      for (const [phaseId, status] of phases) {
        const marker =
          status.status === 'completed' ? '✅' :
          status.status === 'running' ? '🔄' :
          status.status === 'failed' ? '❌' : '⏳';
        lines.push(`  ${marker} ${phaseId}: ${status.status}`);
      }

      lines.push(``);
      lines.push(`Total Retries: ${session.totalRetries}`);
      lines.push(`User Interventions: ${session.userInterventions}`);

      return {
        success: true,
        message: lines.join('\n'),
        continue: true,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get status: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}