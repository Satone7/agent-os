/**
 * Status command implementation
 */

import { SessionManager } from '../../scheduler/session-manager.js';
import { SessionNotFoundError } from '../../types/errors.js';
import * as os from 'node:os';
import * as path from 'node:path';


/**
 * Execute the status command
 */
export async function statusCommand(sessionId?: string): Promise<void> {
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');
  const sessionManager = new SessionManager(workspaceRoot);

  if (!sessionId) {
    // Try to find active session
    console.log('请指定会话 ID:');
    console.log('  agent-os status <session-id>');
    console.log('  agent-os list  # 查看所有会话\n');
    return;
  }

  try {
    const session = await sessionManager.loadState(sessionId);

    console.log(`\n📋 会话状态\n`);
    console.log(`ID: ${session.id}`);
    console.log(`状态: ${formatState(session.state)}`);
    console.log(`流程: ${session.flowName}`);
    console.log(`请求: ${session.userRequest}`);
    console.log(`创建时间: ${formatTime(session.createdAt)}`);
    console.log(`更新时间: ${formatTime(session.updatedAt)}`);

    console.log(`\n阶段进度:`);
    const phaseIds = Object.keys(session.phaseStatus);
    phaseIds.forEach((phaseId, index) => {
      const status = session.phaseStatus[phaseId];
      const marker = status?.status === 'completed' ? '✅' :
                     status?.status === 'running' ? '🔄' :
                     status?.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${index + 1}. ${phaseId}: ${marker} ${status?.status}`);
    });

    console.log(`\n统计:`);
    console.log(`  总重试次数: ${session.totalRetries}`);
    console.log(`  用户干预次数: ${session.userInterventions}`);
    console.log();
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      console.error(`\n❌ 会话未找到: ${sessionId}\n`);
    } else {
      throw error;
    }
  }
}

/**
 * Format session state for display
 */
function formatState(state: string): string {
  const stateMap: Record<string, string> = {
    created: '🆕 已创建',
    running: '🔄 运行中',
    paused: '⏸️ 已暂停',
    completed: '✅ 已完成',
    stopped: '⏹️ 已停止',
  };
  return stateMap[state] ?? state;
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}