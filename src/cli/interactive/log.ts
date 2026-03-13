/**
 * /log interactive command
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import type { IInteractiveCommand, CommandContext, CommandResult } from './base.js';

/**
 * View recent logs
 */
export class LogCommand implements IInteractiveCommand {
  readonly name = '/log';
  readonly description = 'View recent logs';

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const logPath = path.join(os.homedir(), '.agent-os', 'logs', 'agent-os.log');

      try {
        const content = await fs.readFile(logPath, 'utf-8');
        const lines = content.split('\n').slice(-50);

        // Filter by session if available
        const filtered = context.sessionId
          ? lines.filter((l) => l.includes(context.sessionId))
          : lines;

        return {
          success: true,
          message: `📋 Recent Logs (${filtered.length} lines):\n\n${filtered.join('\n')}`,
          continue: true,
        };
      } catch {
        return {
          success: false,
          message: 'No log file found. Logs are written to ~/.agent-os/logs/agent-os.log',
          continue: true,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to read logs: ${(error as Error).message}`,
        continue: true,
      };
    }
  }
}