/**
 * Configurable flow paths management
 */

import * as os from 'node:os';
import * as path from 'node:path';

export interface FlowPathsConfig {
  globalPath: string;
  projectPaths: string[];
  customPaths: string[];
}

/**
 * Get default flow paths
 */
export function getDefaultFlowPaths(): FlowPathsConfig {
  return {
    globalPath: path.join(os.homedir(), '.agent-os', 'flows'),
    projectPaths: [path.join(process.cwd(), 'flows')],
    customPaths: [],
  };
}

/**
 * Resolve all flow paths from configuration
 */
export function resolveFlowPaths(config?: Partial<FlowPathsConfig>): string[] {
  const defaults = getDefaultFlowPaths();
  const merged = { ...defaults, ...config };

  const paths: string[] = [];

  // Add in order of priority
  paths.push(merged.globalPath);
  paths.push(...merged.projectPaths);
  paths.push(...merged.customPaths);

  // Remove duplicates
  return [...new Set(paths)];
}

/**
 * Expand path with home directory
 */
export function expandPath(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}