/**
 * Integration tests for session lifecycle
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Scheduler } from '@/scheduler/scheduler';
import { FlowLoader } from '@/flow/loader';
import { SessionManager } from '@/scheduler/session-manager';
import type { Flow } from '@/types/index';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Session Lifecycle Integration', () => {
  let tempDir: string;
  let flowDir: string;
  let workspaceDir: string;
  let scheduler: Scheduler;
  let flowLoader: FlowLoader;
  let sessionManager: SessionManager;

  const sampleFlowYaml = `
id: integration-test-flow
name: Integration Test Flow
version: 1.0.0
description: A flow for integration testing
trigger:
  keywords:
    - integration
    - test
  patterns:
    - "test integration"
phases:
  - id: phase-1
    name: First Phase
    description: First phase of the flow
    agent:
      promptTemplate: prompts/test.md
    timeSlice:
      default: 5m
    outputs:
      - output1.txt
    config:
      maxRetries: 2
  - id: phase-2
    name: Second Phase
    description: Second phase of the flow
    agent:
      promptTemplate: prompts/test.md
    timeSlice:
      default: 10m
    outputs:
      - output2.txt
    config:
      maxRetries: 2
settings:
  defaultModel: claude-sonnet-4-6
  failurePolicy:
    maxTotalRetries: 5
    userNotifyThreshold: 2
`;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-lifecycle-'));
    flowDir = path.join(tempDir, 'flows');
    workspaceDir = path.join(tempDir, 'workspaces');

    await fs.mkdir(flowDir, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });
    await fs.writeFile(path.join(flowDir, 'integration-test-flow.yaml'), sampleFlowYaml);

    flowLoader = new FlowLoader();
    flowLoader.addFlowPath(flowDir);
    await flowLoader.reload();

    sessionManager = new SessionManager(workspaceDir);
    scheduler = new Scheduler(flowLoader, sessionManager);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('createSession', () => {
    it('should create a new session with matched flow', async () => {
      const session = await scheduler.createSession('I want to test integration');

      expect(session.id).toBeDefined();
      expect(session.state).toBe('created');
      expect(session.flowId).toBe('integration-test-flow');
      expect(session.flowName).toBe('Integration Test Flow');
      expect(session.userRequest).toBe('I want to test integration');
      expect(session.currentPhaseIndex).toBe(0);
      expect(Object.keys(session.phaseStatus)).toHaveLength(2);
    });

    it('should initialize all phases as pending', async () => {
      const session = await scheduler.createSession('test integration');

      expect(session.phaseStatus['phase-1']?.status).toBe('pending');
      expect(session.phaseStatus['phase-2']?.status).toBe('pending');
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session by ID', async () => {
      const created = await scheduler.createSession('integration test');
      const retrieved = await scheduler.getSession(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent session', async () => {
      const result = await scheduler.getSession('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('listSessions', () => {
    it.skip('should list all sessions', async () => {
      await scheduler.createSession('test 1');
      await scheduler.createSession('test 2');

      const sessions = await scheduler.listSessions();
      expect(sessions).toHaveLength(2);
    });

    it.skip('should filter sessions by state', async () => {
      const session = await scheduler.createSession('test');
      // Simulate state change
      session.state = 'running';
      await sessionManager.saveState(session);

      const runningSessions = await scheduler.listSessions('running');
      expect(runningSessions).toHaveLength(1);
      expect(runningSessions[0]?.id).toBe(session.id);
    });
  });

  describe('stopSession', () => {
    it('should stop a running session', async () => {
      const session = await scheduler.createSession('test');
      session.state = 'running';
      await sessionManager.saveState(session);

      await scheduler.stopSession(session.id);

      const stopped = await scheduler.getSession(session.id);
      expect(stopped?.state).toBe('stopped');
    });
  });

  describe('getLastSession', () => {
    it.skip('should return the most recently created session', async () => {
      const first = await scheduler.createSession('test 1');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const second = await scheduler.createSession('test 2');

      const last = await scheduler.getLastSession();
      expect(last?.id).toBe(second.id);
    });

    it('should return null when no sessions exist', async () => {
      const result = await scheduler.getLastSession();
      expect(result).toBeNull();
    });
  });
});