/**
 * Time slice and duration utilities
 */

/**
 * Parse a duration string into milliseconds
 * @param duration - Duration string (e.g., "30s", "10m", "1h")
 * @returns Duration in milliseconds
 * @throws Error if format is invalid
 */
export function parseDuration(duration: string): number {
  const match = /^(\d+)(s|m|h)$/.exec(duration);
  if (!match) {
    throw new Error(
      `Invalid duration format: ${duration}. Expected format: <number><unit> where unit is s, m, or h`
    );
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Format milliseconds into a human-readable duration string
 * @param ms - Duration in milliseconds
 * @returns Human-readable string (e.g., "5m 30s")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Validate a time slice duration
 * @param duration - Duration string to validate
 * @returns true if valid, throws error if invalid
 */
export function validateTimeSlice(duration: string): boolean {
  const MIN_SLICE = parseDuration('1m');
  const MAX_SLICE = parseDuration('24h');

  const ms = parseDuration(duration);

  if (ms < MIN_SLICE) {
    throw new Error(
      `Time slice too short: ${duration}. Minimum is 1m.`
    );
  }

  if (ms > MAX_SLICE) {
    throw new Error(
      `Time slice too long: ${duration}. Maximum is 24h.`
    );
  }

  return true;
}

/**
 * Get current timestamp in ISO 8601 format
 * @returns ISO 8601 timestamp string
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate elapsed time from a start timestamp
 * @param startTimestamp - ISO 8601 start timestamp
 * @returns Elapsed time in milliseconds
 */
export function getElapsedTime(startTimestamp: string): number {
  const start = new Date(startTimestamp).getTime();
  const now = Date.now();
  return now - start;
}

/**
 * Check if a timestamp is older than a given duration
 * @param timestamp - ISO 8601 timestamp
 * @param maxAge - Maximum age in milliseconds
 * @returns true if timestamp is older than maxAge
 */
export function isOlderThan(timestamp: string, maxAge: number): boolean {
  const time = new Date(timestamp).getTime();
  const now = Date.now();
  return now - time > maxAge;
}