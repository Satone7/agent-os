/**
 * Workspace Management Module Contracts
 */

/**
 * Workspace manager
 */
export interface IWorkspaceManager {
  createWorkspace(sessionId: string): Promise<string>;
  createSubWorkspace(sessionId: string, phaseId: string): Promise<string>;
  getWorkspacePath(sessionId: string): string;
  getSubWorkspacePath(sessionId: string, phaseId: string): string;
  workspaceExists(sessionId: string): Promise<boolean>;
  cleanWorkspace(sessionId: string): Promise<void>;
  archiveWorkspace(sessionId: string): Promise<string>;
  getWorkspaceSize(sessionId: string): Promise<number>;
  listWorkspaces(): Promise<WorkspaceInfo[]>;
}

/**
 * Workspace information
 */
export interface WorkspaceInfo {
  sessionId: string;
  path: string;
  size: number;
  createdAt: Date;
  lastModified: Date;
  state: 'active' | 'archived' | 'expired';
}

/**
 * Session retention policy manager
 */
export interface IRetentionPolicy {
  isExpired(sessionId: string, completedAt: Date): Promise<boolean>;
  findExpiredSessions(): Promise<string[]>;
  runCleanup(options?: CleanupOptions): Promise<CleanupResult>;
  getConfig(): RetentionConfig;
  setConfig(config: Partial<RetentionConfig>): Promise<void>;
}

/**
 * Retention configuration
 */
export interface RetentionConfig {
  cleanupAfterDays: number;
  archiveBeforeDelete: boolean;
  archivePath: string;
  maxSizeBytes: number;
}

/**
 * Cleanup options
 */
export interface CleanupOptions {
  dryRun?: boolean;
  force?: boolean;
  sessionIds?: string[];
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  cleanedCount: number;
  archivedCount: number;
  bytesFreed: number;
  errors: CleanupError[];
}

/**
 * Cleanup error
 */
export interface CleanupError {
  sessionId: string;
  error: string;
}