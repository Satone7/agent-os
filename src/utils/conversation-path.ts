/**
 * Conversation path resolver
 */

import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Get the conversation file path for a workspace
 */
export function getConversationPath(workspacePath: string): string {
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

/**
 * Get the Claude projects directory for a workspace
 */
export function getClaudeProjectsDir(workspacePath: string): string {
  const encodedPath = workspacePath
    .replace(/\//g, '-')
    .replace(/\\/g, '-')
    .replace(/:/g, '-');

  return path.join(
    os.homedir(),
    '.claude',
    'projects',
    encodedPath
  );
}

/**
 * Check if conversation exists
 */
export async function conversationExists(conversationPath: string): Promise<boolean> {
  try {
    const fs = await import('node:fs/promises');
    await fs.access(conversationPath);
    return true;
  } catch {
    return false;
  }
}