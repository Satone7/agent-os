/**
 * Sub-agent spawner implementation
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';

import { v4 as uuidv4 } from 'uuid';

import type { ISpawner, SubAgentSpawnConfig, SubAgentProcess } from '../agent/contracts.js';
import { getLogger } from '../logging/logger.js';
import { SubAgentSpawnError } from '../types/errors.js';

const log = getLogger();

/**
 * Sub-agent spawner implementation
 */
export class Spawner implements ISpawner {
  private claudePath: string;
  private processes: Map<string, SubAgentProcess> = new Map();
  private childProcesses: Map<string, ChildProcess> = new Map();

  constructor(claudePath: string = 'claude') {
    this.claudePath = claudePath;
  }

  /**
   * Spawn a new sub-agent process
   */
  async spawn(config: SubAgentSpawnConfig): Promise<SubAgentProcess> {
    const processId = uuidv4();
    const conversationPath = this.getConversationPath(config.workspacePath);

    log.info(
      {
        processId,
        phaseId: config.phaseId,
        workspacePath: config.workspacePath,
      },
      'Spawning sub-agent'
    );

    // Build command arguments
    const args: string[] = [];

    if (config.model) {
      args.push('--model', config.model);
    }

    if (config.skills && config.skills.length > 0) {
      for (const skill of config.skills) {
        args.push('--skill', skill);
      }
    }

    if (config.tools && config.tools.length > 0) {
      // Restrict tools if specified
      args.push('--allowedTools', config.tools.join(','));
    }

    // Spawn the process
    let childProcess: ChildProcess;
    try {
      childProcess = spawn(this.claudePath, args, {
        cwd: config.workspacePath,
        env: {
          ...process.env,
          ...config.env,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      throw new SubAgentSpawnError(
        'claude_cli_not_found',
        `Claude CLI not found at ${this.claudePath}`
      );
    }

    if (!childProcess.pid) {
      throw new SubAgentSpawnError('workspace_error', 'Failed to start sub-agent process');
    }

    // Send initial prompt via stdin
    if (childProcess.stdin) {
      childProcess.stdin.write(config.prompt);
      childProcess.stdin.end();
    }

    // Create process handle
    const processHandle: SubAgentProcess = {
      id: processId,
      pid: childProcess.pid,
      phaseId: config.phaseId,
      workspacePath: config.workspacePath,
      conversationPath,
      startTime: new Date(),
      status: 'running',
    };

    // Store references
    this.processes.set(processId, processHandle);
    this.childProcesses.set(processId, childProcess);

    // Handle process events
    childProcess.on('exit', (code) => {
      log.info({ processId, exitCode: code }, 'Sub-agent process exited');
      const proc = this.processes.get(processId);
      if (proc) {
        proc.status = 'terminated';
      }
    });

    childProcess.on('error', (error) => {
      log.error({ processId, error }, 'Sub-agent process error');
    });

    return processHandle;
  }

  /**
   * Check if a process is still alive
   */
  async isAlive(processId: string): Promise<boolean> {
    const proc = this.processes.get(processId);
    if (!proc) {
      return false;
    }

    return proc.status === 'running' || proc.status === 'spawning';
  }

  /**
   * Terminate a sub-agent process
   */
  async kill(processId: string, force = false): Promise<void> {
    const childProcess = this.childProcesses.get(processId);
    const proc = this.processes.get(processId);

    if (!childProcess || !proc) {
      return;
    }

    log.info({ processId, force }, 'Terminating sub-agent');

    if (force) {
      childProcess.kill('SIGKILL');
    } else {
      childProcess.kill('SIGTERM');
    }

    proc.status = 'terminated';
  }

  /**
   * Send input to a running sub-agent
   */
  async sendInput(processId: string, input: string): Promise<void> {
    const childProcess = this.childProcesses.get(processId);

    if (!childProcess?.stdin) {
      throw new Error(`Process ${processId} not found or not accepting input`);
    }

    childProcess.stdin.write(input);
    log.debug({ processId }, 'Input sent to sub-agent');
  }

  /**
   * Wait for process to exit
   */
  async waitForExit(processId: string, timeout?: number): Promise<number | null> {
    const childProcess = this.childProcesses.get(processId);

    if (!childProcess) {
      return null;
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = (): void => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      childProcess.on('exit', (code) => {
        cleanup();
        resolve(code ?? 0);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup();
          resolve(null);
        }, timeout);
      }
    });
  }

  /**
   * Get process by ID
   */
  getProcess(processId: string): SubAgentProcess | undefined {
    return this.processes.get(processId);
  }

  /**
   * Get conversation path for a workspace
   */
  private getConversationPath(workspacePath: string): string {
    // Claude CLI stores conversations in .claude/projects/
    const encodedPath = workspacePath
      .replace(/\//g, '-')
      .replace(/\\/g, '-')
      .replace(/:/g, '-');

    return path.join(
      os.homedir(),
      '.claude',
      'projects',
      encodedPath,
      'conversation.jsonl'
    );
  }
}