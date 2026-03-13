/**
 * Zod schema for Flow validation
 */

import { z } from 'zod';

/**
 * Time slice configuration schema
 */
export const TimeSliceConfigSchema = z.object({
  default: z.string().regex(/^\d+[smh]$/, 'Invalid time format. Use format like "10m", "1h"'),
  max: z.string().regex(/^\d+[smh]$/, 'Invalid time format. Use format like "10m", "1h"').optional(),
});

/**
 * Agent configuration schema
 */
export const AgentConfigSchema = z.object({
  model: z.string().optional(),
  promptTemplate: z.string().min(1, 'Prompt template path is required'),
  skills: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

/**
 * Phase configuration schema
 */
export const PhaseConfigSchema = z.object({
  maxRetries: z.number().int().min(0).max(10),
  allowSkip: z.boolean().optional(),
  requireUserConfirm: z.boolean().optional(),
});

/**
 * Phase schema
 */
export const PhaseSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'Phase ID must be kebab-case'),
  name: z.string().min(1, 'Phase name is required'),
  description: z.string().min(1, 'Phase description is required'),
  agent: AgentConfigSchema,
  timeSlice: TimeSliceConfigSchema.optional(),
  outputs: z.array(z.string()).min(1, 'At least one output pattern is required'),
  config: PhaseConfigSchema,
});

/**
 * Flow trigger schema
 */
export const FlowTriggerSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword is required'),
  patterns: z.array(z.string()).optional(),
});

/**
 * Failure policy schema
 */
export const FailurePolicySchema = z.object({
  maxTotalRetries: z.number().int().min(0).max(100),
  userNotifyThreshold: z.number().int().min(1).max(10),
});

/**
 * Flow settings schema
 */
export const FlowSettingsSchema = z.object({
  defaultModel: z.string().min(1, 'Default model is required'),
  failurePolicy: FailurePolicySchema,
});

/**
 * Full flow schema
 */
export const FlowSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'Flow ID must be kebab-case'),
  name: z.string().min(1, 'Flow name is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic (e.g., 1.0.0)'),
  description: z.string().min(1, 'Flow description is required'),
  trigger: FlowTriggerSchema,
  phases: z.array(PhaseSchema).min(1, 'At least one phase is required'),
  settings: FlowSettingsSchema,
});

/**
 * Flow metadata schema (for listing)
 */
export const FlowMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  path: z.string(),
});

/**
 * Validate a flow definition
 * @param data - Raw flow data
 * @returns Parsed and validated flow
 * @throws ZodError if validation fails
 */
export function validateFlow(data: unknown): z.infer<typeof FlowSchema> {
  return FlowSchema.parse(data);
}

/**
 * Safely validate a flow definition
 * @param data - Raw flow data
 * @returns Success object with parsed flow or error details
 */
export function safeValidateFlow(
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<typeof FlowSchema>> {
  return FlowSchema.safeParse(data);
}

// Type exports
export type FlowInput = z.infer<typeof FlowSchema>;
export type PhaseInput = z.infer<typeof PhaseSchema>;
export type FlowTriggerInput = z.infer<typeof FlowTriggerSchema>;
export type FlowSettingsInput = z.infer<typeof FlowSettingsSchema>;