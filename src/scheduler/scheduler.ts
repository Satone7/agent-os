/**
 * Main scheduler implementation
 */

import { v4 as uuidv4 } from 'uuid';

import type { IFlowLoader } from '../flow/contracts.js';
import { getLogger } from '../logging/logger.js';
import { SessionNotFoundError } from '../types/errors.js';
import type { Session, SessionState } from '../types/index.js';
import { getTimestamp } from '../utils/time.js';

import type { IScheduler, ISessionManager, DecisionRecord } from './contracts.js';

const log = getLogger();

/**
 * Main scheduler implementation
 */
export class Scheduler implements IScheduler {
  private flowLoader: IFlowLoader;
  private sessionManager: ISessionManager;

  constructor(flowLoader: IFlowLoader, sessionManager: ISessionManager) {
    this.flowLoader = flowLoader;
    this.sessionManager = sessionManager;
  }

  /**
   * Create a new session from a user request
   */
  async createSession(userRequest: string): Promise<Session> {
    log.info({ userRequest }, 'Creating new session');

    // Match flow
    const flow = await this.flowLoader.matchFlow(userRequest);
    if (!flow) {
      throw new Error('No matching flow found for request');
    }

    log.info({ flowId: flow.id, flowName: flow.name }, 'Flow matched');

    // Create session ID
    const sessionId = uuidv4();

    // Initialize workspace
    await this.sessionManager.initializeWorkspace(sessionId);

    // Build initial phase status
    const phaseStatus: Session['phaseStatus'] = {};
    for (const phase of flow.phases) {
      phaseStatus[phase.id] = {
        status: 'pending',
        retryCount: 0,
        grantedTimeSlices: [],
      };
    }

    // Create session
    const session: Session = {
      id: sessionId,
      state: 'created',
      workspacePath: '', // Will be set by session manager
      flowId: flow.id,
      flowName: flow.name,
      currentPhaseIndex: 0,
      currentPhase: flow.phases[0]?.id ?? '',
      phaseStatus,
      totalRetries: 0,
      userInterventions: 0,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      userRequest,
    };

    // Save session
    await this.sessionManager.saveState(session);

    // Record decision
    const decision: DecisionRecord = {
      timestamp: getTimestamp(),
      action: 'start_flow',
      params: { flowId: flow.id },
      reason: `Matched user request to flow "${flow.name}"`,
    };
    await this.sessionManager.recordDecision(sessionId, decision);

    log.info({ sessionId, flowId: flow.id }, 'Session created');
    return session;
  }

  /**
   * Resume an existing session by ID
   */
  async resumeSession(sessionId: string): Promise<Session> {
    log.info({ sessionId }, 'Resuming session');

    const session = await this.sessionManager.loadState(sessionId);

    if (session.state === 'completed' || session.state === 'stopped') {
      throw new Error(`Cannot resume session in state ${session.state}`);
    }

    // Update state
    session.state = 'running';
    session.updatedAt = getTimestamp();
    await this.sessionManager.saveState(session);

    log.info({ sessionId }, 'Session resumed');
    return session;
  }

  /**
   * Stop a running session
   */
  async stopSession(sessionId: string): Promise<void> {
    log.info({ sessionId }, 'Stopping session');

    const session = await this.sessionManager.loadState(sessionId);
    session.state = 'stopped';
    session.updatedAt = getTimestamp();
    await this.sessionManager.saveState(session);

    log.info({ sessionId }, 'Session stopped');
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await this.sessionManager.loadState(sessionId);
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all sessions (optionally filtered by state)
   */
  async listSessions(_state?: SessionState): Promise<Session[]> {
    // For now, this would need a separate index or scan
    // This is a placeholder - actual implementation would scan workspace
    return [];
  }

  /**
   * Get the most recent session
   */
  async getLastSession(): Promise<Session | null> {
    // Placeholder - would need to track sessions or scan workspace
    return null;
  }
}