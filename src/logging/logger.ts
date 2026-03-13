/**
 * Logger factory using pino
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import pino from 'pino';
import type { Logger, LoggerOptions } from 'pino';

const pinoLogger = pino as unknown as {
  (options?: LoggerOptions): Logger;
  stdTimeFunctions: { isoTime: () => string };
};

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Log level: trace, debug, info, warn, error */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** Log file path (optional, defaults to stdout) */
  file?: string;
  /** Pretty print for development */
  pretty?: boolean;
  /** Base fields to include in all logs */
  base?: Record<string, unknown>;
}

/**
 * Create a pino logger instance
 * @param config - Logger configuration
 * @returns Logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const { level = 'info', pretty = false, base = {} } = config;

  const options: LoggerOptions = {
    level,
    base: {
      pid: process.pid,
      ...base,
    },
    timestamp: pinoLogger.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  // Use pino-pretty for development
  if (pretty) {
    return pinoLogger({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pinoLogger(options);
}

/**
 * Create a child logger with additional context
 * @param parent - Parent logger
 * @param context - Additional context fields
 * @returns Child logger instance
 */
export function createChildLogger(
  parent: Logger,
  context: Record<string, unknown>
): Logger {
  return parent.child(context);
}

// Default logger instance
let defaultLogger: Logger | null = null;

/**
 * Get the default logger instance
 * @param config - Optional configuration to initialize
 * @returns Default logger instance
 */
export function getLogger(config?: LoggerConfig): Logger {
  if (!defaultLogger) {
    defaultLogger = createLogger(config);
  }
  return defaultLogger;
}

/**
 * Reset the default logger (useful for testing)
 */
export function resetLogger(): void {
  defaultLogger = null;
}