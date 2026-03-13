/**
 * Unit tests for interactive commands
 */

import { describe, it, expect, vi } from 'vitest';
import { StatusCommand } from '../../../src/cli/interactive/status.js';
import { PauseCommand } from '../../../src/cli/interactive/pause.js';
import { ResumeCommand } from '../../../src/cli/interactive/resume.js';
import { SkipCommand } from '../../../src/cli/interactive/skip.js';
import { InputCommand } from '../../../src/cli/interactive/input.js';
import { StopCommand } from '../../../src/cli/interactive/stop.js';

describe('Interactive Commands', () => {
  describe('StatusCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new StatusCommand();
      expect(cmd.name).toBe('/status');
      expect(cmd.description).toContain('status');
    });
  });

  describe('PauseCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new PauseCommand();
      expect(cmd.name).toBe('/pause');
      expect(cmd.description).toContain('Pause');
    });
  });

  describe('ResumeCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new ResumeCommand();
      expect(cmd.name).toBe('/resume');
      expect(cmd.description).toContain('Resume');
    });
  });

  describe('SkipCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new SkipCommand();
      expect(cmd.name).toBe('/skip');
      expect(cmd.description).toContain('Skip');
    });
  });

  describe('InputCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new InputCommand();
      expect(cmd.name).toBe('/input');
      expect(cmd.description).toContain('input');
    });
  });

  describe('StopCommand', () => {
    it('should have correct name and description', () => {
      const cmd = new StopCommand();
      expect(cmd.name).toBe('/stop');
      expect(cmd.description).toContain('Stop');
    });
  });
});