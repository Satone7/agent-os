/**
 * Unit tests for time-slice monitor
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Monitor } from '../../../src/scheduler/monitor.js';
import type { MonitorHandle } from '../../../src/scheduler/contracts.js';

describe('Monitor', () => {
  let monitor: Monitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = new Monitor();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startMonitoring', () => {
    it('should start monitoring and call callback after duration', async () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle = monitor.startMonitoring('process-1', '1m', callback);

      expect(handle.id).toBeDefined();
      expect(handle.processId).toBe('process-1');
      expect(handle.duration).toBe(60000);

      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);

      expect(callback).toHaveBeenCalled();
    });

    it('should create unique handle IDs', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle1 = monitor.startMonitoring('process-1', '1m', callback);
      const handle2 = monitor.startMonitoring('process-2', '1m', callback);

      expect(handle1.id).not.toBe(handle2.id);
    });
  });

  describe('cancelMonitoring', () => {
    it('should cancel active monitoring', async () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle = monitor.startMonitoring('process-1', '1m', callback);

      monitor.cancelMonitoring(handle);

      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time in milliseconds', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle = monitor.startMonitoring('process-1', '1m', callback);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      const remaining = monitor.getRemainingTime(handle);
      expect(remaining).toBe(30000);
    });

    it('should return 0 for expired or cancelled monitor', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle = monitor.startMonitoring('process-1', '1m', callback);

      monitor.cancelMonitoring(handle);

      const remaining = monitor.getRemainingTime(handle);
      expect(remaining).toBe(0);
    });
  });

  describe('extendTimeSlice', () => {
    it('should extend the monitoring duration', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const handle = monitor.startMonitoring('process-1', '1m', callback);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      // Extend by 5 minutes
      monitor.extendTimeSlice(handle, '5m');

      const remaining = monitor.getRemainingTime(handle);
      // Original remaining was 30 seconds, plus 5 minutes = 5m 30s
      expect(remaining).toBe(330000);
    });
  });
});