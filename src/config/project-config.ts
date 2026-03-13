/**
 * Project-specific configuration
 */

import { cosmiconfigSync } from 'cosmiconfig';
import { z } from 'zod';

import { getLogger } from '../logging/logger.js';

const log = getLogger();

/**
 * Project configuration schema
 */
export const ProjectConfigSchema = z.object({
  project: z.string().optional(),
  flows: z
    .object({
      paths: z.array(z.string()).optional(),
    })
    .optional(),
  default: z
    .object({
      model: z.string().optional(),
    })
    .optional(),
  phases: z
    .record(
      z.string(),
      z.object({
        timeSlice: z
          .object({
            default: z.string().optional(),
          })
          .optional(),
      })
    )
    .optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

const MODULE_NAME = 'agent-os';

/**
 * Load project configuration from current directory
 */
export function loadProjectConfig(projectDir: string = process.cwd()): ProjectConfig {
  const explorer = cosmiconfigSync(MODULE_NAME, {
    searchPlaces: [
      '.agent-os.yaml',
      '.agent-os.yml',
      '.agent-os.json',
      'package.json', // Can have "agent-os" key
    ],
  });

  try {
    const result = explorer.search(projectDir);

    if (result && !result.isEmpty) {
      log.debug({ configPath: result.filepath }, 'Loaded project config');
      return ProjectConfigSchema.parse(result.config);
    }
  } catch (error) {
    log.warn({ error, projectDir }, 'Failed to load project config');
  }

  return {};
}

/**
 * Get effective configuration by merging global and project configs
 */
export function getEffectiveConfig(
  globalConfig: { default?: { model?: string }; flows?: { paths?: string[] } },
  projectConfig: ProjectConfig
): {
  model: string;
  flowPaths: string[];
} {
  const model = projectConfig.default?.model ?? globalConfig.default?.model ?? 'claude-sonnet-4-6';

  const flowPaths = [
    ...(globalConfig.flows?.paths ?? []),
    ...(projectConfig.flows?.paths ?? []),
  ];

  return { model, flowPaths };
}