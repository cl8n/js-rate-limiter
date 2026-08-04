/**
 * A basic rate limiter that waits a fixed amount of time between jobs (functions that return promises).
 */
export default class RateLimiter {
	#delayBetweenMs: number;
	#lastRun = Number.NEGATIVE_INFINITY;
	#running = false;
	#runningDelayResolve: (() => void) | undefined;
	#runningDelayTimeout: NodeJS.Timeout | undefined;
	#waiting: (() => void)[] = [];

	/**
	 * @param delayBetweenMs Delay between processing jobs in the queue.
	 */
	constructor(delayBetweenMs: number) {
		this.#delayBetweenMs = delayBetweenMs;
	}

	/**
	 * Cancel any current delay and begin processing the next job.
	 */
	advance(): void {
		this.#lastRun = Number.NEGATIVE_INFINITY;

		clearTimeout(this.#runningDelayTimeout);
		this.#runningDelayResolve?.();
	}

	/**
	 * Run a rate-limited job.
	 * @param job Job to add to the queue.
	 * @returns The result of the job.
	 */
	run<T>(job: () => T | Promise<T>): Promise<T> {
		return this.#wait()
			.then(job)
			.finally(() => this.#end());
	}

	#end(): void {
		this.#running = false;
		this.#waiting.shift()?.();
	}

	async #wait(): Promise<void> {
		if (this.#running) {
			await new Promise<void>((resolve) => {
				this.#waiting.push(resolve);
			});
		}

		this.#running = true;

		while (Date.now() - this.#lastRun < this.#delayBetweenMs) {
			await new Promise<void>((resolve) => {
				this.#runningDelayResolve = resolve;
				this.#runningDelayTimeout = setTimeout(
					resolve,
					this.#delayBetweenMs - (Date.now() - this.#lastRun),
				);
			});
		}

		this.#lastRun = Date.now();
		this.#runningDelayResolve = undefined;
		this.#runningDelayTimeout = undefined;
	}
}
