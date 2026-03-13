/**
 * Time-slice monitor implementation
 */

import { v4 as uuidv4 } from 'uuid';
import { parseDuration } from '../utils/time.js';
import { getLogger } from '../logging/logger.js';
import type { IMonitor, MonitorHandle } from './contracts.js';

const log = getLogger();

/**
 * Monitor implementation using setTimeout
 */
export class Monitor implements IMonitor {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private handles: Map<string, MonitorHandle> = new Map();

  /**
   * Start monitoring a sub-agent
   */
  startMonitoring(
    processId: string,
    duration: string,
    callback: () => Promise<void>
  ): MonitorHandle {
    const id = uuidv4();
    const durationMs = parseDuration(duration);

    const handle: MonitorHandle = {
      id,
      processId,
      startTime: new Date(),
      duration: durationMs,
    };

    this.handles.set(id, handle);

    const timer = setTimeout(async () => {
      log.info({ processId, handleId: id }, 'Time slice expired');
      try {
        await callback();
      } catch (error) {
        log.error({ processId, error }, 'Time slice callback error');
      }
      this.handles.delete(id);
      this.timers.delete(id);
    }, durationMs);

    this.timers.set(id, timer);

    log.debug({ processId, handleId: id, duration }, 'Monitoring started');
    return handle;
  }

  /**
   * Cancel active monitoring
   */
  cancelMonitoring(handle: MonitorHandle): void {
    const timer = this.timers.get(handle.id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(handle.id);
    }
    this.handles.delete(handle.id);
    log.debug({ handleId: handle.id }, 'Monitoring cancelled');
  }

  /**
   * Get remaining time in current time slice
   */
  getRemainingTime(handle: MonitorHandle): number {
    const storedHandle = this.handles.get(handle.id);
    if (!storedHandle) {
      return 0;
    }

    const elapsed = Date.now() - storedHandle.startTime.getTime();
    const remaining = storedHandle.duration - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Extend current time slice
   */
  extendTimeSlice(handle: MonitorHandle, additionalDuration: string): void {
    const storedHandle = this.handles.get(handle.id);
    if (!storedHandle) {
      return;
    }

    const additionalMs = parseDuration(additionalDuration);
    storedHandle.duration += additionalMs;

    // Reset timer
    const timer = this.timers.get(handle.id);
    if (timer) {
      clearTimeout(timer);

      const elapsed = Date.now() - storedHandle.startTime.getTime();
      // Calculate new remaining time for logging
      void (storedHandle.duration - elapsed);

      log.debug(
        { handleId: handle.id, additionalDuration, newDuration: storedHandle.duration },
        'Time slice extended'
      );
    }
  }
}