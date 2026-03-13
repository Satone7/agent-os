/**
 * Workspace Management Module Contracts
 *
 * These interfaces define the boundaries of the workspace module,
 * which handles session workspace creation, isolation, and cleanup.
 */

/**
 * Workspace manager
 */
export interface IWorkspaceManager {
  /**
   * Create a new session workspace
   * @param sessionId - Session UUID
   * @returns Path to created workspace
   */
  createWorkspace(sessionId: string): Promise<string>;

  /**
   * Create a sub-agent workspace within a session
   * @param sessionId - Session UUID
   * @param phaseId - Phase ID
   * @returns Path to created sub-workspace
   */
  createSubWorkspace(sessionId: string, phaseId: string): Promise<string>;

  /**
   * Get workspace path for a session
   * @param sessionId - Session UUID
   * @returns Absolute path to workspace
   */
  getWorkspacePath(sessionId: string): string;

  /**
   * Get sub-agent workspace path
   * @param sessionId - Session UUID
   * @param phaseId - Phase ID
   * @returns Absolute path to sub-workspace
   */
  getSubWorkspacePath(sessionId: string, phaseId: string): string;

  /**
   * Check if workspace exists
   * @param sessionId - Session UUID
   */
  workspaceExists(sessionId: string): Promise<boolean>;

  /**
   * Clean up a workspace (delete all files)
   * @param sessionId - Session UUID
   */
  cleanWorkspace(sessionId: string): Promise<void>;

  /**
   * Archive a workspace to compressed format
   * @param sessionId - Session UUID
   * @returns Path to archive file
   */
  archiveWorkspace(sessionId: string): Promise<string>;

  /**
   * Get workspace disk usage
   * @param sessionId - Session UUID
   * @returns Size in bytes
   */
  getWorkspaceSize(sessionId: string): Promise<number>;

  /**
   * List all workspaces
   * @returns Array of workspace info
   */
  listWorkspaces(): Promise<WorkspaceInfo[]>;
}

/**
 * Workspace information
 */
export interface WorkspaceInfo {
  sessionId: string;
  path: string;
  size: number; // bytes
  createdAt: Date;
  lastModified: Date;
  state: 'active' | 'archived' | 'expired';
}

/**
 * Session retention policy manager
 */
export interface IRetentionPolicy {
  /**
   * Check if a session has expired
   * @param sessionId - Session UUID
   * @param completedAt - Session completion timestamp
   * @returns true if session should be cleaned up
   */
  isExpired(sessionId: string, completedAt: Date): Promise<boolean>;

  /**
   * Find all expired sessions
   * @returns Array of expired session IDs
   */
  findExpiredSessions(): Promise<string[]>;

  /**
   * Run cleanup for expired sessions
   * @param options - Cleanup options
   * @returns Cleanup result
   */
  runCleanup(options?: CleanupOptions): Promise<CleanupResult>;

  /**
   * Get retention configuration
   * @returns Retention settings
   */
  getConfig(): RetentionConfig;

  /**
   * Update retention configuration
   * @param config - New settings
   */
  setConfig(config: Partial<RetentionConfig>): Promise<void>;
}

/**
 * Retention configuration
 */
export interface RetentionConfig {
  /** Days to keep completed sessions */
  cleanupAfterDays: number;
  /** Whether to archive before delete */
  archiveBeforeDelete: boolean;
  /** Archive storage path */
  archivePath: string;
  /** Maximum total workspace size (bytes) before forced cleanup */
  maxSizeBytes: number;
}

/**
 * Cleanup options
 */
export interface CleanupOptions {
  /** Dry run - don't actually delete */
  dryRun?: boolean;
  /** Force cleanup even if not expired */
  force?: boolean;
  /** Specific sessions to clean */
  sessionIds?: string[];
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  /** Number of sessions cleaned */
  cleanedCount: number;
  /** Number of sessions archived */
  archivedCount: number;
  /** Bytes freed */
  bytesFreed: number;
  /** Errors encountered */
  errors: CleanupError[];
}

/**
 * Cleanup error
 */
export interface CleanupError {
  sessionId: string;
  error: string;
}

/**
 * Workspace file operations
 */
export interface IWorkspaceFiles {
  /**
   * Read session state file
   * @param sessionId - Session UUID
   * @returns Session state JSON
   */
  readSessionState(sessionId: string): Promise<SessionStateFile>;

  /**
   * Write session state file
   * @param sessionId - Session UUID
   * @param state - State to write
   */
  writeSessionState(sessionId: string, state: SessionStateFile): Promise<void>;

  /**
   * Read progress markdown file
   * @param sessionId - Session UUID
   * @returns Progress content
   */
  readProgress(sessionId: string): Promise<string>;

  /**
   * Write progress markdown file
   * @param sessionId - Session UUID
   * @param content - Progress content
   */
  writeProgress(sessionId: string, content: string): Promise<void>;

  /**
   * Append to progress file
   * @param sessionId - Session UUID
   * @param content - Content to append
   */
  appendProgress(sessionId: string, content: string): Promise<void>;

  /**
   * Read decisions history
   * @param sessionId - Session UUID
   * @returns Array of decisions
   */
  readDecisions(sessionId: string): Promise<DecisionFileEntry[]>;

  /**
   * Append a decision to history
   * @param sessionId - Session UUID
   * @param decision - Decision to record
   */
  appendDecision(sessionId: string, decision: DecisionFileEntry): Promise<void>;
}

/**
 * Session state file format
 */
export interface SessionStateFile {
  sessionId: string;
  flowId: string;
  flowName: string;
  currentPhase: string;
  currentPhaseIndex: number;
  phaseStatus: Record<string, PhaseStatusRecord>;
  totalRetries: number;
  userInterventions: number;
  lastCheckTime: string;
  nextAction: string;
  nextActionParams: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  userRequest: string;
}

/**
 * Phase status record
 */
export interface PhaseStatusRecord {
  status: string;
  startTime: string;
  endTime?: string;
  retryCount: number;
  grantedTimeSlices: string[];
  error?: {
    type: string;
    message: string;
    severity: string;
  };
}

/**
 * Decision file entry
 */
export interface DecisionFileEntry {
  timestamp: string;
  action: string;
  params?: Record<string, unknown>;
  reason: string;
}

/**
 * Errors
 */
export class WorkspaceError extends Error {
  constructor(
    public readonly sessionId: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(`Workspace error for ${sessionId}: ${operation}`);
    this.name = 'WorkspaceError';
  }
}

export class DiskFullError extends Error {
  constructor(
    public readonly requiredBytes: number,
    public readonly availableBytes: number
  ) {
    super(`Disk full: need ${requiredBytes}, have ${availableBytes}`);
    this.name = 'DiskFullError';
  }
}