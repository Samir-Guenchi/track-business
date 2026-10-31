import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PollingLoop } from './polling-loop.js';

const logger = new Logger('test');

describe('PollingLoop', () => {
  it('keeps going while there is work, then idles until stopped', async () => {
    const batches = [2, 1, 0];
    const runOnce = vi.fn(async () => batches.shift() ?? 0);
    const loop = new PollingLoop({ name: 'task', runOnce }, { idleMs: 60_000, logger });

    loop.start();
    await vi.waitFor(() => expect(runOnce).toHaveBeenCalledTimes(3));
    await loop.stop();

    expect(runOnce).toHaveBeenCalledTimes(3);
  });

  it('survives a failing batch', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    let calls = 0;
    const runOnce = async () => {
      calls += 1;
      if (calls === 1) throw new Error('database down');
      return 0;
    };
    const loop = new PollingLoop({ name: 'task', runOnce }, { idleMs: 1, logger });

    loop.start();
    await vi.waitFor(() => expect(calls).toBeGreaterThanOrEqual(2));
    await loop.stop();

    expect(logger.error).toHaveBeenCalledWith('task failed: database down');
  });
});
