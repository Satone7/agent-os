/**
 * Status formatter for CLI display
 */

import type { Session } from '../../types/index.js';
import { formatDuration, getElapsedTime } from '../../utils/time.js';

/**
 * Format session status for display
 */
export function formatSessionStatus(session: Session): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(`📋 Session: ${session.id.slice(0, 8)}...`);
  lines.push(`   Flow: ${session.flowName}`);
  lines.push(`   State: ${formatState(session.state)}`);
  lines.push('');

  // Current phase
  const phaseCount = Object.keys(session.phaseStatus).length;
  lines.push(`Current Phase: ${session.currentPhase} (${session.currentPhaseIndex + 1}/${phaseCount})`);

  // Running time
  if (session.state === 'running') {
    const elapsed = getElapsedTime(session.createdAt);
    lines.push(`Running Time: ${formatDuration(elapsed)}`);
  }
  lines.push('');

  // Phase progress
  lines.push('Phase Progress:');
  const phases = Object.entries(session.phaseStatus);
  for (const [phaseId, status] of phases) {
    const marker = getPhaseMarker(status.status);
    lines.push(`  ${marker} ${phaseId}: ${status.status}`);
  }
  lines.push('');

  // Stats
  lines.push(`Total Retries: ${session.totalRetries}`);
  lines.push(`User Interventions: ${session.userInterventions}`);

  return lines.join('\n');
}

/**
 * Format session state with emoji
 */
function formatState(state: string): string {
  const stateMap: Record<string, string> = {
    created: '🆕 Created',
    running: '🔄 Running',
    paused: '⏸️ Paused',
    completed: '✅ Completed',
    stopped: '⏹️ Stopped',
  };
  return stateMap[state] ?? state;
}

/**
 * Get phase status marker
 */
function getPhaseMarker(status: string): string {
  const markers: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    skipped: '⏭️',
    paused: '⏸️',
  };
  return markers[status] ?? '❓';
}

/**
 * Format available commands
 */
export function formatAvailableCommands(): string {
  return `
Available Commands:
  /status   - Show detailed session status
  /pause    - Pause current phase
  /resume   - Resume paused phase
  /skip     - Skip current phase
  /input    - Send input to sub-agent
  /stop     - End session
  /help     - Show available commands
`;
}