/**
 * Flow loader implementation
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import * as yaml from 'js-yaml';

import { getLogger } from '../logging/logger.js';
import { FlowNotFoundError, FlowValidationError } from '../types/errors.js';
import type { Flow } from '../types/index.js';

import type { IFlowLoader, FlowMeta } from './contracts.js';
import { safeValidateFlow } from './validator.js';

const log = getLogger();

/**
 * Flow loader implementation
 */
export class FlowLoader implements IFlowLoader {
  private flowPaths: string[] = [];
  private flowCache: Map<string, Flow> = new Map();
  private flowMetaCache: Map<string, FlowMeta> = new Map();

  /**
   * Add a flow path to search
   */
  addFlowPath(flowPath: string): void {
    if (!this.flowPaths.includes(flowPath)) {
      this.flowPaths.push(flowPath);
    }
  }

  /**
   * Get all configured flow paths
   */
  getFlowPaths(): string[] {
    return [...this.flowPaths];
  }

  /**
   * Load a flow by ID
   */
  async loadFlow(flowId: string): Promise<Flow> {
    // Check cache first
    const cached = this.flowCache.get(flowId);
    if (cached) {
      return cached;
    }

    // Find and load flow file
    const meta = this.flowMetaCache.get(flowId);
    if (!meta) {
      throw new FlowNotFoundError(flowId);
    }

    const flow = await this.loadFlowFile(meta.path);
    this.flowCache.set(flowId, flow);
    return flow;
  }

  /**
   * List all available flows
   */
  async listFlows(): Promise<FlowMeta[]> {
    return Array.from(this.flowMetaCache.values());
  }

  /**
   * Match a user request to a flow
   * Returns null if no match found
   */
  async matchFlow(userRequest: string): Promise<Flow | null> {
    const flows = await this.listFlows();
    const loadedFlows: Flow[] = [];

    for (const meta of flows) {
      try {
        const flow = await this.loadFlow(meta.id);
        loadedFlows.push(flow);
      } catch (error) {
        log.warn({ flowId: meta.id }, 'Failed to load flow for matching');
      }
    }

    // Simple keyword matching for now
    const lowerRequest = userRequest.toLowerCase();

    for (const flow of loadedFlows) {
      const keywords = flow.trigger.keywords.map((k) => k.toLowerCase());
      for (const keyword of keywords) {
        if (lowerRequest.includes(keyword)) {
          return flow;
        }
      }

      // Pattern matching
      if (flow.trigger.patterns) {
        for (const pattern of flow.trigger.patterns) {
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(userRequest)) {
              return flow;
            }
          } catch {
            log.warn({ pattern }, 'Invalid regex pattern in flow');
          }
        }
      }
    }

    return null;
  }

  /**
   * Reload flows from configured paths
   */
  async reload(): Promise<void> {
    this.flowCache.clear();
    this.flowMetaCache.clear();

    for (const flowPath of this.flowPaths) {
      await this.scanFlowPath(flowPath);
    }

    log.info({ flowCount: this.flowMetaCache.size }, 'Flows reloaded');
  }

  /**
   * Scan a directory for flow files
   */
  private async scanFlowPath(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const filePath = path.join(dirPath, entry.name);
          try {
            const meta = await this.loadFlowMeta(filePath);
            if (meta) {
              this.flowMetaCache.set(meta.id, meta);
            }
          } catch (error) {
            log.warn({ filePath, error }, 'Failed to load flow meta');
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        log.warn({ dirPath, error }, 'Failed to scan flow directory');
      }
    }
  }

  /**
   * Load flow metadata from a file
   */
  private async loadFlowMeta(filePath: string): Promise<FlowMeta | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content) as Record<string, unknown>;

    if (!data || typeof data !== 'object') {
      return null;
    }

    const result = safeValidateFlow(data);
    if (!result.success) {
      log.warn({ filePath, errors: result.error.errors }, 'Invalid flow file');
      return null;
    }

    return {
      id: result.data.id,
      name: result.data.name,
      version: result.data.version,
      description: result.data.description,
      path: filePath,
    };
  }

  /**
   * Load a flow from a file
   */
  private async loadFlowFile(filePath: string): Promise<Flow> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content);

    const result = safeValidateFlow(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new FlowValidationError(path.basename(filePath, '.yaml'), errors);
    }

    return result.data as Flow;
  }
}