import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '../logger.js';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('info() logs with blue ANSI code', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message');
    expect(spy).toHaveBeenCalledOnce();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[34m');
    expect(output).toContain('test message');
    expect(output).toContain('\x1b[0m');
  });

  it('success() logs with green ANSI code', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.success('ok');
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[32m');
    expect(output).toContain('ok');
  });

  it('warn() logs with yellow ANSI code', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.warn('caution');
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[33m');
    expect(output).toContain('caution');
  });

  it('error() logs to stderr with red ANSI code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('fail');
    expect(spy).toHaveBeenCalledOnce();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[31m');
    expect(output).toContain('fail');
  });

  it('cyan() logs with cyan ANSI code', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.cyan('info');
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[36m');
  });

  it('magenta() logs with magenta ANSI code', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.magenta('info');
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[35m');
  });

  it('plain() logs without ANSI codes', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.plain('raw text');
    expect(spy).toHaveBeenCalledWith('raw text');
  });

  it('banner() prints multi-line banner', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.banner();
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(4);
    const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('SPECTRA');
    expect(allOutput).toContain('Full-spectrum test automation');
  });

  it('separator() prints colored separator with label', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.separator('blue', 'TEST LABEL');
    const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('TEST LABEL');
    expect(allOutput).toContain('═');
  });

  it('separator() uses green color code for green', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.separator('green', 'GREEN');
    const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('\x1b[32m');
  });

  it('separator() uses magenta color code for other colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.separator('magenta', 'MAG');
    const allOutput = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(allOutput).toContain('\x1b[35m');
  });
});
