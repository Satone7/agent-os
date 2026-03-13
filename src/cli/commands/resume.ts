/**
 * Resume command implementation
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { SessionManager } from '../../scheduler/session-manager.js';
import { SessionNotFoundError } from '../../types/errors.js';


interface ResumeOptions {
  last?: boolean;
}

/**
 * Execute the resume command
 */
export async function resumeCommand(
  sessionId: string,
  _options: ResumeOptions
): Promise<void> {
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');
  const sessionManager = new SessionManager(workspaceRoot);

  console.log('\n🔄 恢复会话\n');

  try {
    const session = await sessionManager.loadState(sessionId);

    if (session.state === 'completed') {
      console.log('❌ 会话已完成，无法恢复。\n');
      return;
    }

    if (session.state === 'stopped') {
      console.log('❌ 会话已停止，无法恢复。\n');
      return;
    }

    // Update state to running
    session.state = 'running';
    await sessionManager.saveState(session);

    console.log(`✅ 会话已恢复: ${session.id}`);
    console.log(`   流程: ${session.flowName}`);
    console.log(`   当前阶段: ${session.currentPhase}`);
    console.log(`   请求: ${session.userRequest}\n`);

    console.log('使用以下命令监控进度:');
    console.log(`  agent-os status ${session.id}\n`);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      console.error(`\n❌ 会话未找到: ${sessionId}\n`);
    } else {
      throw error;
    }
  }
}