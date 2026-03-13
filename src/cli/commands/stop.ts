/**
 * Stop command implementation
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { SessionManager } from '../../scheduler/session-manager.js';
import { SessionNotFoundError } from '../../types/errors.js';


/**
 * Execute the stop command
 */
export async function stopCommand(sessionId?: string): Promise<void> {
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');
  const sessionManager = new SessionManager(workspaceRoot);

  if (!sessionId) {
    console.log('\n请指定会话 ID:');
    console.log('  agent-os stop <session-id>');
    console.log('  agent-os list  # 查看所有会话\n');
    return;
  }

  console.log('\n⏹️ 停止会话\n');

  try {
    const session = await sessionManager.loadState(sessionId);

    if (session.state === 'completed') {
      console.log('会话已完成。\n');
      return;
    }

    if (session.state === 'stopped') {
      console.log('会话已停止。\n');
      return;
    }

    session.state = 'stopped';
    await sessionManager.saveState(session);

    console.log(`✅ 会话已停止: ${session.id}\n`);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      console.error(`\n❌ 会话未找到: ${sessionId}\n`);
    } else {
      throw error;
    }
  }
}