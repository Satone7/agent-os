/**
 * Cleanup command implementation
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';


interface CleanupOptions {
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Execute the cleanup command
 */
export async function cleanupCommand(options: CleanupOptions): Promise<void> {
  const workspaceRoot = path.join(os.homedir(), '.agent-os', 'workspaces');

  console.log('\n🧹 清理会话\n');

  if (options.dryRun) {
    console.log('(模拟运行 - 不会实际删除)\n');
  }

  try {
    const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
    const sessionDirs = entries.filter(
      (e) => e.isDirectory() && e.name.startsWith('session-')
    );

    if (sessionDirs.length === 0) {
      console.log('没有需要清理的会话。\n');
      return;
    }

    let cleanedCount = 0;
    let totalSize = 0;

    for (const dir of sessionDirs) {
      const sessionId = dir.name.replace('session-', '');
      const sessionPath = path.join(workspaceRoot, dir.name);

      try {
        // Read session state
        const statePath = path.join(sessionPath, 'main', 'session.json');
        const content = await fs.readFile(statePath, 'utf-8');
        const session = JSON.parse(content) as { state: string; completedAt?: string };

        const shouldClean =
          options.force ||
          session.state === 'stopped' ||
          session.state === 'completed';

        if (shouldClean) {
          // Calculate size
          const size = await getDirectorySize(sessionPath);
          totalSize += size;

          if (options.dryRun) {
            console.log(`将删除: ${sessionId} (${formatSize(size)})`);
          } else {
            await fs.rm(sessionPath, { recursive: true, force: true });
            console.log(`已删除: ${sessionId} (${formatSize(size)})`);
          }

          cleanedCount++;
        }
      } catch {
        // Can't read state, skip
      }
    }

    console.log();
    if (cleanedCount === 0) {
      console.log('没有需要清理的会话。');
      console.log('使用 --force 选项强制清理所有会话。\n');
    } else {
      console.log(`总计: ${cleanedCount} 个会话, ${formatSize(totalSize)}\n`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('没有找到工作空间。\n');
    } else {
      throw error;
    }
  }
}

/**
 * Get total size of a directory
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += await getDirectorySize(fullPath);
    } else {
      const stats = await fs.stat(fullPath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

/**
 * Format size in human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}