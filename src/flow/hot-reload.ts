/**
 * Flow hot-reload functionality
 */

import chokidar from 'chokidar';

import { getLogger } from '../logging/logger.js';

import type { IFlowLoader } from './contracts.js';

const log = getLogger();

export interface HotReloadOptions {
  debounceMs?: number;
  onLoad?: (flowId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Create a hot-reload watcher for flow files
 */
export function createFlowWatcher(
  flowLoader: IFlowLoader,
  options: HotReloadOptions = {}
): chokidar.FSWatcher {
  const { debounceMs = 1000, onError } = options;

  const flowPaths = flowLoader.getFlowPaths();
  const pattern = '**/*.{yaml,yml}';

  let reloadTimeout: NodeJS.Timeout | null = null;

  const watcher = chokidar.watch(
    flowPaths.map((p) => path.join(p, pattern)),
    {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    }
  );

  watcher.on('add', (filePath: string) => {
    log.info({ filePath }, 'Flow file added');
    scheduleReload();
  });

  watcher.on('change', (filePath: string) => {
    log.info({ filePath }, 'Flow file changed');
    scheduleReload();
  });

  watcher.on('unlink', (filePath: string) => {
    log.info({ filePath }, 'Flow file removed');
    scheduleReload();
  });

  watcher.on('error', (error: Error) => {
    log.error({ error }, 'Flow watcher error');
    onError?.(error);
  });

  function scheduleReload(): void {
    if (reloadTimeout) {
      clearTimeout(reloadTimeout);
    }

    reloadTimeout = setTimeout(async () => {
      try {
        await flowLoader.reload();
        log.info('Flows reloaded');
      } catch (error) {
        log.error({ error }, 'Failed to reload flows');
        onError?.(error as Error);
      }
    }, debounceMs);
  }

  return watcher;
}

// Need to import path
import * as path from 'node:path';