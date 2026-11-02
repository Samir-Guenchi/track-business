/** Anything with an `error` method: Nest's Logger, pino, console. */
export interface LoopLogger {
  error(message: string): void;
}

export interface LoopTask {
  readonly name: string;
  /** Does one batch of work; returns how many items it handled (0 means idle). */
  runOnce(): Promise<number>;
}

/**
 * Runs a task back to back while it finds work, and sleeps `idleMs` when it does not. A failing
 * batch is logged and retried after the idle delay; it never stops the loop.
 */
export class PollingLoop {
  private running = false;
  private done: Promise<void> = Promise.resolve();
  private timer: NodeJS.Timeout | undefined;
  private wake: (() => void) | undefined;

  constructor(
    private readonly task: LoopTask,
    private readonly options: { idleMs: number; logger: LoopLogger },
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.done = this.loop();
  }

  async stop(): Promise<void> {
    this.running = false;
    clearTimeout(this.timer);
    this.wake?.();
    await this.done;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      const handled = await this.task.runOnce().catch((error: Error) => {
        this.options.logger.error(`${this.task.name} failed: ${error.message}`);
        return 0;
      });
      if (handled === 0) await this.sleep();
    }
  }

  private sleep(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve;
      this.timer = setTimeout(resolve, this.options.idleMs);
    });
  }
}
