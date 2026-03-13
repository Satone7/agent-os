/**
 * Unit tests for session manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../../src/scheduler/session-manager.js';
import type { Session, Flow, Phase } from '../../../src/types/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('SessionManager', () => {
  let manager: SessionManager;
  let tempDir: string;

  const samplePhase: Phase = {
    id: 'test-phase',
    name: 'Test Phase',
    description: 'A test phase',
    agent: {
      promptTemplate: 'prompts/test.md',
    },
    outputs: ['output.txt'],
    config: {
      maxRetries: 3,
    },
  };

  const sampleFlow: Flow = {
    id: 'test-flow',
    name: 'Test Flow',
    version: '1.0.0',
    description: 'A test flow',
    trigger: { keywords: ['test'] },
    phases: [samplePhase],
    settings: {
      defaultModel: 'claude-sonnet-4-6',
      failurePolicy: {
        maxTotalRetries: 5,
        userNotifyThreshold: 2,
      },
    },
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-manager-test-'));
    manager = new SessionManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('initializeWorkspace', () => {
    it('should create session workspace directory', async () => {
      const sessionId = 'test-session-123';
      const workspacePath = await manager.initializeWorkspace(sessionId);

      expect(workspacePath).toContain(sessionId);
      const exists = await fs.stat(workspacePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create main workspace subdirectory', async () => {
      const sessionId = 'test-session-456';
      const workspacePath = await manager.initializeWorkspace(sessionId);

      const mainPath = path.join(workspacePath, 'main');
      const exists = await fs.stat(mainPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('saveState and loadState', () => {
    it('should persist and retrieve session state', async () => {
      const session: Session = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        state: 'created',
        workspacePath: '',
        flowId: sampleFlow.id,
        flowName: sampleFlow.name,
        currentPhaseIndex: 0,
        currentPhase: samplePhase.id,
        phaseStatus: {
          [samplePhase.id]: {
            status: 'pending',
            retryCount: 0,
            grantedTimeSlices: [],
          },
        },
        totalRetries: 0,
        userInterventions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userRequest: 'Test request',
      };

      await manager.initializeWorkspace(session.id);
      await manager.saveState(session);

      const loaded = await manager.loadState(session.id);
      expect(loaded.id).toBe(session.id);
      expect(loaded.flowId).toBe(sampleFlow.id);
      expect(loaded.userRequest).toBe('Test request');
    });

    it('should throw SessionNotFoundError for missing session', async () => {
      await expect(manager.loadState('nonexistent')).rejects.toThrow('Session not found');
    });
  });

  describe('updatePhaseStatus', () => {
    it('should update phase status in session', async () => {
      const session: Session = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        state: 'running',
        workspacePath: '',
        flowId: sampleFlow.id,
        flowName: sampleFlow.name,
        currentPhaseIndex: 0,
        currentPhase: samplePhase.id,
        phaseStatus: {
          [samplePhase.id]: {
            status: 'pending',
            retryCount: 0,
            grantedTimeSlices: [],
          },
        },
        totalRetries: 0,
        userInterventions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userRequest: 'Test request',
      };

      await manager.initializeWorkspace(session.id);
      await manager.saveState(session);

      await manager.updatePhaseStatus(session.id, samplePhase.id, {
        status: 'running',
        startTime: new Date().toISOString(),
      });

      const loaded = await manager.loadState(session.id);
      expect(loaded.phaseStatus[samplePhase.id]?.status).toBe('running');
    });
  });

  describe('recordDecision', () => {
    it('should append decision to decisions file', async () => {
      const session: Session = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        state: 'running',
        workspacePath: '',
        flowId: sampleFlow.id,
        flowName: sampleFlow.name,
        currentPhaseIndex: 0,
        currentPhase: samplePhase.id,
        phaseStatus: {
          [samplePhase.id]: {
            status: 'pending',
            retryCount: 0,
            grantedTimeSlices: [],
          },
        },
        totalRetries: 0,
        userInterventions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userRequest: 'Test request',
      };

      await manager.initializeWorkspace(session.id);
      await manager.saveState(session);

      await manager.recordDecision(session.id, {
        timestamp: new Date().toISOString(),
        action: 'start_flow',
        reason: 'User requested test flow',
      });

      const decisions = await manager.loadDecisions(session.id);
      expect(decisions).toHaveLength(1);
      expect(decisions[0]?.action).toBe('start_flow');
    });
  });
});