import Queue from './Queue';

interface Work {
  fn: () => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
  started: boolean;
}

async function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default class {
  private readonly queue: Queue<Work>;
  private wait: Promise<void>;

  private readonly waitDuringWork;
  private readonly waitMs;

  public constructor(waitMs: number, waitDuringWork = true) {
    this.queue = new Queue();
    this.wait = Promise.resolve();
    this.waitDuringWork = waitDuringWork;
    this.waitMs = waitMs;
  }

  public async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.enqueue({ fn, resolve, reject, started: false });
      void this.dequeue();
    });
  }

  public reset(): void {
    this.queue.reset();
  }

  public size(): number {
    return this.queue.size;
  }

  public wrap<T>(fn: () => Promise<T>): () => Promise<T> {
    return async (): Promise<T> => this.enqueue(fn);
  }

  private async dequeue(): Promise<void> {
    const work = this.queue.peek();

    if (work == null || work.started) {
      return;
    }

    work.started = true;
    await this.wait;

    // Queue was reset while waiting
    if (this.queue.size === 0) {
      return;
    }

    if (this.waitDuringWork) {
      this.wait = wait(this.waitMs);
    }

    work
      .fn()
      .then(work.resolve)
      .catch(work.reject)
      .finally(() => {
        if (!this.waitDuringWork) {
          this.wait = wait(this.waitMs);
        }

        this.queue.dequeue();
        void this.dequeue();
      });
  }
}
