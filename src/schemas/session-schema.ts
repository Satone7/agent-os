/**
 * Zod schema for Session state validation
 */

import { z } from 'zod';

/**
 * Phase status value schema
 */
export const PhaseStatusValueSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);

/**
 * Phase error type schema
 */
export const PhaseErrorTypeSchema = z.enum([
  'startup_failed',
  'timeout',
  'crash',
  'stuck_in_loop',
  'blocked',
  'output_validation_failed',
]);

/**
 * Phase error schema
 */
export const PhaseErrorSchema = z.object({
  type: PhaseErrorTypeSchema,
  message: z.string(),
  timestamp: z.string().datetime(),
  severity: z.enum(['minor', 'major', 'critical']),
  context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Phase status schema
 */
export const PhaseStatusSchema = z.object({
  status: PhaseStatusValueSchema,
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  retryCount: z.number().int().min(0),
  grantedTimeSlices: z.array(z.string()),
  error: PhaseErrorSchema.optional(),
});

/**
 * Session state enum schema
 */
export const SessionStateSchema = z.enum([
  'created',
  'running',
  'paused',
  'completed',
  'stopped',
]);

/**
 * Full session schema
 */
export const SessionSchema = z.object({
  id: z.string().uuid(),
  state: SessionStateSchema,
  workspacePath: z.string(),
  flowId: z.string(),
  flowName: z.string(),
  currentPhaseIndex: z.number().int().min(0),
  currentPhase: z.string(),
  phaseStatus: z.record(z.string(), PhaseStatusSchema),
  totalRetries: z.number().int().min(0),
  userInterventions: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  userRequest: z.string(),
  lastCheckTime: z.string().datetime().optional(),
  nextAction: z.string().optional(),
  nextActionParams: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Decision action schema
 */
export const DecisionActionSchema = z.enum([
  'start_flow',
  'start_next_phase',
  'grant_time_slice',
  'check_subagent',
  'retry_phase',
  'skip_phase',
  'ask_user',
  'complete_flow',
]);

/**
 * Decision record schema
 */
export const DecisionRecordSchema = z.object({
  timestamp: z.string().datetime(),
  action: DecisionActionSchema,
  params: z.record(z.string(), z.unknown()).optional(),
  reason: z.string(),
});

/**
 * Validate session state
 * @param data - Raw session data
 * @returns Parsed and validated session
 */
export function validateSession(data: unknown): z.infer<typeof SessionSchema> {
  return SessionSchema.parse(data);
}

/**
 * Safely validate session state
 * @param data - Raw session data
 * @returns Success object with parsed session or error details
 */
export function safeValidateSession(
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<typeof SessionSchema>> {
  return SessionSchema.safeParse(data);
}

// Type exports
export type SessionInput = z.infer<typeof SessionSchema>;
export type PhaseStatusInput = z.infer<typeof PhaseStatusSchema>;
export type PhaseErrorInput = z.infer<typeof PhaseErrorSchema>;
export type DecisionRecordInput = z.infer<typeof DecisionRecordSchema>;