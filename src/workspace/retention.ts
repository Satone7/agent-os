/**
 * Session retention policy implementation
 */

import { getLogger } from '../logging/logger.js';

import type { IRetentionPolicy, RetentionConfig, CleanupOptions, CleanupResult } from './contracts.js';
import { WorkspaceManager } from './manager.js';

const log = getLogger();

const DEFAULT_CONFIG: RetentionConfig = {
  cleanupAfterDays: 7,
  archiveBeforeDelete: false,
  archivePath: '',
  maxSizeBytes: 1024 * 1024 * 1024, // 1GB
};

/**
 * Retention policy implementation
 */
export class RetentionPolicy implements IRetentionPolicy {
  private config: RetentionConfig;
  private workspaceManager: WorkspaceManager;

  constructor(workspaceRoot: string, config?: Partial<RetentionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workspaceManager = new WorkspaceManager(workspaceRoot);
  }

  /**
   * Check if a session has expired
   */
  async isExpired(_sessionId: string, completedAt: Date): Promise<boolean> {
    const now = new Date();
    const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion >= this.config.cleanupAfterDays;
  }

  /**
   * Find all expired sessions
   */
  async findExpiredSessions(): Promise<string[]> {
    const expired: string[] = [];
    const workspaces = await this.workspaceManager.listWorkspaces();

    for (const workspace of workspaces) {
      if (workspace.state === 'archived') {
        // Check if it's old enough
        const completedAt = workspace.lastModified;
        if (await this.isExpired(workspace.sessionId, completedAt)) {
          expired.push(workspace.sessionId);
        }
      }
    }

    return expired;
  }

  /**
   * Run cleanup for expired sessions
   */
  async runCleanup(options?: CleanupOptions): Promise<CleanupResult> {
    const result: CleanupResult = {
      cleanedCount: 0,
      archivedCount: 0,
      bytesFreed: 0,
      errors: [],
    };

    let sessionsToClean: string[];

    if (options?.sessionIds) {
      sessionsToClean = options.sessionIds;
    } else if (options?.force) {
      const workspaces = await this.workspaceManager.listWorkspaces();
      sessionsToClean = workspaces.map((w) => w.sessionId);
    } else {
      sessionsToClean = await this.findExpiredSessions();
    }

    for (const sessionId of sessionsToClean) {
      try {
        if (options?.dryRun) {
          const size = await this.workspaceManager.getWorkspaceSize(sessionId);
          result.bytesFreed += size;
          result.cleanedCount++;
          log.info({ sessionId, dryRun: true }, 'Would clean session');
        } else {
          const size = await this.workspaceManager.getWorkspaceSize(sessionId);

          if (this.config.archiveBeforeDelete) {
            await this.workspaceManager.archiveWorkspace(sessionId);
            result.archivedCount++;
          }

          await this.workspaceManager.cleanWorkspace(sessionId);
          result.bytesFreed += size;
          result.cleanedCount++;
          log.info({ sessionId }, 'Session cleaned');
        }
      } catch (error) {
        result.errors.push({
          sessionId,
          error: (error as Error).message,
        });
        log.warn({ sessionId, error }, 'Failed to clean session');
      }
    }

    log.info(
      {
        cleanedCount: result.cleanedCount,
        archivedCount: result.archivedCount,
        bytesFreed: result.bytesFreed,
      },
      'Cleanup completed'
    );

    return result;
  }

  /**
   * Get retention configuration
   */
  getConfig(): RetentionConfig {
    return { ...this.config };
  }

  /**
   * Update retention configuration
   */
  async setConfig(config: Partial<RetentionConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    log.info({ config: this.config }, 'Retention config updated');
  }
}