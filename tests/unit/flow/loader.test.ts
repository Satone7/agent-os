/**
 * Unit tests for flow loader
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlowLoader } from '../../../src/flow/loader.js';
import type { Flow } from '../../../src/types/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('FlowLoader', () => {
  let loader: FlowLoader;
  let tempDir: string;

  beforeEach(async () => {
    loader = new FlowLoader();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flow-loader-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadFlow', () => {
    it('should load a valid flow from YAML file', async () => {
      const flowYaml = `
id: test-flow
name: Test Flow
version: 1.0.0
description: A test flow
trigger:
  keywords:
    - test
    - demo
phases:
  - id: phase-1
    name: Phase 1
    description: First phase
    agent:
      promptTemplate: prompts/test.md
    outputs:
      - output.txt
    config:
      maxRetries: 3
settings:
  defaultModel: claude-sonnet-4-6
  failurePolicy:
    maxTotalRetries: 5
    userNotifyThreshold: 2
`;
      await fs.writeFile(path.join(tempDir, 'test-flow.yaml'), flowYaml);

      loader.addFlowPath(tempDir);
      await loader.reload();
      const flow = await loader.loadFlow('test-flow');

      expect(flow.id).toBe('test-flow');
      expect(flow.name).toBe('Test Flow');
      expect(flow.trigger.keywords).toContain('test');
      expect(flow.phases).toHaveLength(1);
    });

    it('should throw FlowNotFoundError for missing flow', async () => {
      await expect(loader.loadFlow('nonexistent')).rejects.toThrow('Flow not found');
    });

    it('should throw FlowValidationError for invalid flow', async () => {
      const invalidYaml = `
id: invalid-flow
name: Invalid Flow
# Missing required fields
`;
      await fs.writeFile(path.join(tempDir, 'invalid-flow.yaml'), invalidYaml);

      loader.addFlowPath(tempDir);
      await loader.reload();
      await expect(loader.loadFlow('invalid-flow')).rejects.toThrow();
    });
  });

  describe('listFlows', () => {
    it('should list all available flows', async () => {
      const flow1 = `
id: flow-1
name: Flow 1
version: 1.0.0
description: First flow
trigger:
  keywords: [test]
phases:
  - id: p1
    name: Phase 1
    description: Phase
    agent:
      promptTemplate: prompts/test.md
    outputs: [out.txt]
    config:
      maxRetries: 1
settings:
  defaultModel: claude-sonnet-4-6
  failurePolicy:
    maxTotalRetries: 5
    userNotifyThreshold: 2
`;
      const flow2 = `
id: flow-2
name: Flow 2
version: 1.0.0
description: Second flow
trigger:
  keywords: [test2]
phases:
  - id: p1
    name: Phase 1
    description: Phase
    agent:
      promptTemplate: prompts/test.md
    outputs: [out.txt]
    config:
      maxRetries: 1
settings:
  defaultModel: claude-sonnet-4-6
  failurePolicy:
    maxTotalRetries: 5
    userNotifyThreshold: 2
`;
      await fs.writeFile(path.join(tempDir, 'flow-1.yaml'), flow1);
      await fs.writeFile(path.join(tempDir, 'flow-2.yaml'), flow2);

      loader.addFlowPath(tempDir);
      await loader.reload();
      const flows = await loader.listFlows();

      expect(flows).toHaveLength(2);
      expect(flows.map((f) => f.id)).toContain('flow-1');
      expect(flows.map((f) => f.id)).toContain('flow-2');
    });
  });

  describe('reload', () => {
    it('should reload flows from paths', async () => {
      const flowYaml = `
id: reload-test
name: Reload Test
version: 1.0.0
description: Test reload
trigger:
  keywords: [reload]
phases:
  - id: p1
    name: Phase 1
    description: Phase
    agent:
      promptTemplate: prompts/test.md
    outputs: [out.txt]
    config:
      maxRetries: 1
settings:
  defaultModel: claude-sonnet-4-6
  failurePolicy:
    maxTotalRetries: 5
    userNotifyThreshold: 2
`;
      await fs.writeFile(path.join(tempDir, 'reload-test.yaml'), flowYaml);

      loader.addFlowPath(tempDir);
      await loader.reload();

      const flow = await loader.loadFlow('reload-test');
      expect(flow.id).toBe('reload-test');
    });
  });
});