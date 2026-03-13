/**
 * Session state validator for crash recovery
 */

import type { Session } from '../types/index.js';
import { safeValidateSession } from '../schemas/session-schema.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  needsRecovery: boolean;
  recoveryAction?: 'restart_phase' | 'restart_flow' | 'manual_intervention';
}

/**
 * Validate session state for recovery
 */
export function validateSessionForRecovery(session: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Schema validation
  const result = safeValidateSession(session);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      warnings: [],
      needsRecovery: true,
      recoveryAction: 'manual_intervention',
    };
  }

  const validSession = session as Session;

  // Check for interrupted phases
  const runningPhases = Object.entries(validSession.phaseStatus)
    .filter(([_, status]) => status.status === 'running');

  if (runningPhases.length > 0) {
    warnings.push(`Found ${runningPhases.length} running phase(s) that may have been interrupted`);
    for (const [phaseId, status] of runningPhases) {
      const startTime = status.startTime ? new Date(status.startTime) : null;
      if (startTime) {
        const elapsed = Date.now() - startTime.getTime();
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        if (hours > 1) {
          warnings.push(`Phase "${phaseId}" has been running for ${hours} hours`);
        }
      }
    }
  }

  // Check state consistency
  if (validSession.state === 'running' && runningPhases.length === 0) {
    errors.push('Session state is "running" but no phase is currently running');
  }

  // Check for phase index consistency
  const phaseIds = Object.keys(validSession.phaseStatus);
  if (validSession.currentPhaseIndex >= phaseIds.length) {
    errors.push(`Current phase index (${validSession.currentPhaseIndex}) exceeds phase count (${phaseIds.length})`);
  }

  // Determine recovery action
  const recoveryAction: ValidationResult['recoveryAction'] | undefined =
    runningPhases.length > 0
      ? 'restart_phase'
      : errors.length > 0
        ? 'manual_intervention'
        : undefined;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    needsRecovery: runningPhases.length > 0 || errors.length > 0,
    ...(recoveryAction !== undefined && { recoveryAction }),
  };
}

/**
 * Repair session state after crash
 */
export function repairSessionState(session: Session): Session {
  const repaired = { ...session };

  // Reset any running phases to pending
  for (const [phaseId, status] of Object.entries(repaired.phaseStatus)) {
    if (status.status === 'running') {
      const newStatus = {
        ...status,
        status: 'pending' as const,
        retryCount: status.retryCount,
        grantedTimeSlices: status.grantedTimeSlices,
      };
      // Remove startTime and endTime
      delete (newStatus as Record<string, unknown>).startTime;
      delete (newStatus as Record<string, unknown>).endTime;
      repaired.phaseStatus[phaseId] = newStatus;
    }
  }

  // Set state to paused for recovery
  if (repaired.state === 'running') {
    repaired.state = 'paused';
  }

  return repaired;
}