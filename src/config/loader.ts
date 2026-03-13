/**
 * Configuration loader using cosmiconfig
 */

import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import * as path from 'node:path';
import * as os from 'node:os';
import { getLogger } from '../logging/logger.js';
import { z } from 'zod';

const log = getLogger();

/**
 * Global configuration schema
 */
export const GlobalConfigSchema = z.object({
  default: z
    .object({
      model: z.string().default('claude-sonnet-4-6'),
    })
    .default({}),
  workspace: z
    .object({
      root: z.string().default(path.join(os.homedir(), '.agent-os', 'workspaces')),
      cleanupAfterDays: z.number().default(7),
    })
    .default({}),
  claude: z
    .object({
      path: z.string().default('claude'),
      defaultTimeout: z.string().default('30m'),
    })
    .default({}),
  logging: z
    .object({
      level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
      file: z.string().default(path.join(os.homedir(), '.agent-os', 'logs', 'agent-os.log')),
    })
    .default({}),
  flows: z
    .object({
      paths: z.array(z.string()).default([
        path.join(os.homedir(), '.agent-os', 'flows'),
        './flows',
      ]),
    })
    .default({}),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

const MODULE_NAME = 'agent-os';

/**
 * Load global configuration
 */
export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      path.join(os.homedir(), '.agent-os', 'config.yaml'),
      path.join(os.homedir(), '.agent-os', 'config.yml'),
      path.join(os.homedir(), '.agent-os', 'config.json'),
    ],
  });

  try {
    const result = await explorer.search();

    if (result && !result.isEmpty) {
      log.debug({ configPath: result.filepath }, 'Loaded global config');
      return GlobalConfigSchema.parse(result.config);
    }
  } catch (error) {
    log.warn({ error }, 'Failed to load global config, using defaults');
  }

  return GlobalConfigSchema.parse({});
}

/**
 * Load global config synchronously
 */
export function loadGlobalConfigSync(): GlobalConfig {
  const explorer = cosmiconfigSync(MODULE_NAME, {
    searchPlaces: [
      path.join(os.homedir(), '.agent-os', 'config.yaml'),
      path.join(os.homedir(), '.agent-os', 'config.yml'),
      path.join(os.homedir(), '.agent-os', 'config.json'),
    ],
  });

  try {
    const result = explorer.search();

    if (result && !result.isEmpty) {
      return GlobalConfigSchema.parse(result.config);
    }
  } catch (error) {
    log.warn({ error }, 'Failed to load global config, using defaults');
  }

  return GlobalConfigSchema.parse({});
}