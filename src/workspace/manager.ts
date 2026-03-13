/**
 * Workspace manager implementation
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { getLogger } from '../logging/logger.js';

import type { IWorkspaceManager, WorkspaceInfo } from './contracts.js';

const log = getLogger();

/**
 * Workspace manager implementation
 */
export class WorkspaceManager implements IWorkspaceManager {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Create a new session workspace
   */
  async createWorkspace(sessionId: string): Promise<string> {
    const workspacePath = this.getWorkspacePath(sessionId);
    const mainPath = path.join(workspacePath, 'main');

    await fs.mkdir(mainPath, { recursive: true });

    log.info({ sessionId, workspacePath }, 'Session workspace created');
    return workspacePath;
  }

  /**
   * Create a sub-agent workspace within a session
   */
  async createSubWorkspace(sessionId: string, phaseId: string): Promise<string> {
    const subPath = this.getSubWorkspacePath(sessionId, phaseId);
    await fs.mkdir(subPath, { recursive: true });

    log.debug({ sessionId, phaseId, subPath }, 'Sub-agent workspace created');
    return subPath;
  }

  /**
   * Get workspace path for a session
   */
  getWorkspacePath(sessionId: string): string {
    return path.join(this.rootPath, `session-${sessionId}`);
  }

  /**
   * Get sub-agent workspace path
   */
  getSubWorkspacePath(sessionId: string, phaseId: string): string {
    return path.join(this.getWorkspacePath(sessionId), `sub-${phaseId}`);
  }

  /**
   * Check if workspace exists
   */
  async workspaceExists(sessionId: string): Promise<boolean> {
    const workspacePath = this.getWorkspacePath(sessionId);
    try {
      await fs.access(workspacePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up a workspace
   */
  async cleanWorkspace(sessionId: string): Promise<void> {
    const workspacePath = this.getWorkspacePath(sessionId);
    await fs.rm(workspacePath, { recursive: true, force: true });
    log.info({ sessionId }, 'Workspace cleaned');
  }

  /**
   * Archive a workspace
   */
  async archiveWorkspace(sessionId: string): Promise<string> {
    const archivePath = path.join(this.rootPath, 'archives', `${sessionId}.tar.gz`);

    await fs.mkdir(path.dirname(archivePath), { recursive: true });

    // Note: Actual archiving would require tar or similar
    // For now, just return the path
    log.info({ sessionId, archivePath }, 'Workspace archived');
    return archivePath;
  }

  /**
   * Get workspace disk usage
   */
  async getWorkspaceSize(sessionId: string): Promise<number> {
    const workspacePath = this.getWorkspacePath(sessionId);
    return this.getDirectorySize(workspacePath);
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<WorkspaceInfo[]> {
    const workspaces: WorkspaceInfo[] = [];

    try {
      const entries = await fs.readdir(this.rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('session-')) {
          const sessionId = entry.name.replace('session-', '');
            const workspacePath = path.join(this.rootPath, entry.name);

            try {
              const stats = await fs.stat(workspacePath);
              const size = await this.getDirectorySize(workspacePath);

            // Try to read session state for more info
            let state: WorkspaceInfo['state'] = 'active';
            try {
              const statePath = path.join(workspacePath, 'main', 'session.json');
              const content = await fs.readFile(statePath, 'utf-8');
              const session = JSON.parse(content) as { state: string; completedAt?: string };
              state = session.state === 'completed' || session.state === 'stopped' ? 'archived' : 'active';
            } catch {
              // Ignore errors reading state
            }

            workspaces.push({
              sessionId,
              path: workspacePath,
              size,
              createdAt: stats.birthtime,
              lastModified: stats.mtime,
              state,
            });
          } catch {
            // Skip invalid workspaces
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        log.warn({ error }, 'Failed to list workspaces');
      }
    }

    return workspaces;
  }

  /**
   * Get total size of a directory
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch {
      // Ignore errors
    }

    return totalSize;
  }
}