/**
 * Session manager implementation
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getLogger } from '../logging/logger.js';
import { SessionNotFoundError } from '../types/errors.js';
import type { ISessionManager, DecisionRecord } from './contracts.js';
import type { Session, PhaseStatus } from '../types/index.js';
import { getTimestamp } from '../utils/time.js';
import { safeValidateSession } from '../schemas/session-schema.js';

const log = getLogger();

/**
 * Session manager implementation
 */
export class SessionManager implements ISessionManager {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Initialize a new session workspace
   */
  async initializeWorkspace(sessionId: string): Promise<string> {
    const workspacePath = this.getSessionPath(sessionId);
    const mainPath = path.join(workspacePath, 'main');

    await fs.mkdir(mainPath, { recursive: true });

    log.info({ sessionId, workspacePath }, 'Session workspace initialized');
    return workspacePath;
  }

  /**
   * Load session state from disk
   */
  async loadState(sessionId: string): Promise<Session> {
    const statePath = this.getStatePath(sessionId);

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      const data = JSON.parse(content);

      const result = safeValidateSession(data);
      if (!result.success) {
        log.error({ sessionId, errors: result.error.errors }, 'Invalid session state');
        throw new Error(`Invalid session state for ${sessionId}`);
      }

      return result.data as Session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new SessionNotFoundError(sessionId);
      }
      throw error;
    }
  }

  /**
   * Persist session state to disk
   */
  async saveState(session: Session): Promise<void> {
    const statePath = this.getStatePath(session.id);

    // Update timestamp
    session.updatedAt = getTimestamp();

    await fs.writeFile(statePath, JSON.stringify(session, null, 2), 'utf-8');

    log.debug({ sessionId: session.id }, 'Session state saved');
  }

  /**
   * Update phase status within a session
   */
  async updatePhaseStatus(
    sessionId: string,
    phaseId: string,
    status: Partial<PhaseStatus>
  ): Promise<void> {
    const session = await this.loadState(sessionId);

    const currentStatus = session.phaseStatus[phaseId];
    if (currentStatus) {
      session.phaseStatus[phaseId] = {
        ...currentStatus,
        ...status,
      };
    } else {
      session.phaseStatus[phaseId] = {
        status: status.status ?? 'pending',
        retryCount: status.retryCount ?? 0,
        grantedTimeSlices: status.grantedTimeSlices ?? [],
        ...(status.startTime !== undefined && { startTime: status.startTime }),
        ...(status.endTime !== undefined && { endTime: status.endTime }),
        ...(status.error !== undefined && { error: status.error }),
      };
    }

    await this.saveState(session);
  }

  /**
   * Record a decision in session history
   */
  async recordDecision(sessionId: string, decision: DecisionRecord): Promise<void> {
    const decisionsPath = this.getDecisionsPath(sessionId);

    let decisions: DecisionRecord[] = [];
    try {
      const content = await fs.readFile(decisionsPath, 'utf-8');
      decisions = JSON.parse(content) as DecisionRecord[];
    } catch {
      // File doesn't exist, start with empty array
    }

    decisions.push(decision);
    await fs.writeFile(decisionsPath, JSON.stringify(decisions, null, 2), 'utf-8');

    log.debug({ sessionId, action: decision.action }, 'Decision recorded');
  }

  /**
   * Load decisions history for a session
   */
  async loadDecisions(sessionId: string): Promise<DecisionRecord[]> {
    const decisionsPath = this.getDecisionsPath(sessionId);

    try {
      const content = await fs.readFile(decisionsPath, 'utf-8');
      return JSON.parse(content) as DecisionRecord[];
    } catch {
      return [];
    }
  }

  /**
   * Archive a completed session
   */
  async archiveSession(sessionId: string): Promise<string> {
    const archivePath = path.join(
      this.workspaceRoot,
      'archives',
      `${sessionId}.tar.gz`
    );

    await fs.mkdir(path.dirname(archivePath), { recursive: true });

    // For now, just return the path - actual archiving would use tar
    log.info({ sessionId, archivePath }, 'Session archived');
    return archivePath;
  }

  /**
   * Delete a session and its workspace
   */
  async deleteSession(sessionId: string): Promise<void> {
    const workspacePath = this.getSessionPath(sessionId);
    await fs.rm(workspacePath, { recursive: true, force: true });
    log.info({ sessionId }, 'Session deleted');
  }

  /**
   * Get session workspace path
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.workspaceRoot, `session-${sessionId}`);
  }

  /**
   * Get session state file path
   */
  private getStatePath(sessionId: string): string {
    return path.join(this.getSessionPath(sessionId), 'main', 'session.json');
  }

  /**
   * Get decisions file path
   */
  private getDecisionsPath(sessionId: string): string {
    return path.join(this.getSessionPath(sessionId), 'main', 'decisions.json');
  }
}