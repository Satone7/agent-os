/**
 * CLI entry point
 */

import { Command } from 'commander';
import { getLogger } from '../logging/logger.js';

const log = getLogger();

/**
 * Create and configure the CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('agent-os')
    .description('Flow-driven multi-agent collaboration platform for Claude CLI')
    .version('1.0.0');

  // Start command
  program
    .command('start')
    .description('Start a new session')
    .option('-f, --flow <flowId>', 'Specify flow ID to use')
    .option('-r, --request <request>', 'User request to process')
    .action(async (options) => {
      const { startCommand } = await import('./commands/start.js');
      await startCommand(options);
    });

  // Resume command
  program
    .command('resume <sessionId>')
    .description('Resume an existing session')
    .option('--last', 'Resume the most recent session')
    .action(async (sessionId: string, options) => {
      const { resumeCommand } = await import('./commands/resume.js');
      await resumeCommand(sessionId, options);
    });

  // Stop command
  program
    .command('stop [sessionId]')
    .description('Stop a running session')
    .action(async (sessionId?: string) => {
      const { stopCommand } = await import('./commands/stop.js');
      await stopCommand(sessionId);
    });

  // Status command
  program
    .command('status [sessionId]')
    .description('Get session status')
    .action(async (sessionId?: string) => {
      const { statusCommand } = await import('./commands/status.js');
      await statusCommand(sessionId);
    });

  // List command
  program
    .command('list')
    .description('List all sessions')
    .option('-s, --state <state>', 'Filter by state')
    .action(async (options) => {
      const { listCommand } = await import('./commands/list.js');
      await listCommand(options);
    });

  // Flow commands
  program
    .command('flow')
    .description('Manage flows')
    .command('list')
    .description('List available flows')
    .action(async () => {
      const { flowListCommand } = await import('./commands/flow.js');
      await flowListCommand();
    });

  program
    .command('flow')
    .command('show <flowId>')
    .description('Show flow details')
    .action(async (flowId: string) => {
      const { flowShowCommand } = await import('./commands/flow.js');
      await flowShowCommand(flowId);
    });

  // Cleanup command
  program
    .command('cleanup')
    .description('Clean up old sessions')
    .option('-d, --dry-run', 'Show what would be deleted without deleting')
    .option('-f, --force', 'Force cleanup of all sessions')
    .action(async (options) => {
      const { cleanupCommand } = await import('./commands/cleanup.js');
      await cleanupCommand(options);
    });

  return program;
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const program = createCLI();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    log.error({ error }, 'CLI error');
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}