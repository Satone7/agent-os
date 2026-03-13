/**
 * List command implementation
 */

import { SessionManager } from '../../scheduler/session-manager.js';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';


interface ListOptions {
  state?: string;
}

/**
 * Execute the list command
 */
export async function listCommand(_options: ListOptions): Promise<void> {
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');

  console.log('\n📋 会话列表\n');

  try {
    const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
    const sessionDirs = entries.filter(
      (e) => e.isDirectory() && e.name.startsWith('session-')
    );

    if (sessionDirs.length === 0) {
      console.log('没有找到会话。\n');
      console.log('使用以下命令创建新会话:');
      console.log('  agent-os start\n');
      return;
    }

    const sessionManager = new SessionManager(workspaceRoot);

    for (const dir of sessionDirs) {
      const sessionId = dir.name.replace('session-', '');

      try {
        const session = await sessionManager.loadState(sessionId);
        const stateIcon = formatStateIcon(session.state);

        console.log(`${stateIcon} ${session.id}`);
        console.log(`   流程: ${session.flowName}`);
        console.log(`   请求: ${truncate(session.userRequest, 50)}`);
        console.log(`   状态: ${session.state}`);
        console.log(`   创建: ${formatTime(session.createdAt)}`);
        console.log();
      } catch {
        console.log(`❓ ${sessionId} (无法读取状态)\n`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('没有找到会话。\n');
      console.log('使用以下命令创建新会话:');
      console.log('  agent-os start\n');
    } else {
      throw error;
    }
  }
}

/**
 * Format state as icon
 */
function formatStateIcon(state: string): string {
  const icons: Record<string, string> = {
    created: '🆕',
    running: '🔄',
    paused: '⏸️',
    completed: '✅',
    stopped: '⏹️',
  };
  return icons[state] ?? '❓';
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}