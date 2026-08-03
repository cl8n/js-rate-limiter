/**
 * A basic rate limiter that waits a fixed amount of time between jobs (functions that return promises).
 */
export default class RateLimiter {
	#delayBetweenMs: number;
	#lastRun = Number.NEGATIVE_INFINITY;
	#running: Set<symbol> = new Set();
	#waiting: (() => void)[] = [];

	/**
	 * @param delayBetweenMs Delay between processing jobs in the queue.
	 */
	constructor(delayBetweenMs: number) {
		this.#delayBetweenMs = delayBetweenMs;
	}

	/**
	 * Run a rate-limited job.
	 * @param job Job to add to the queue.
	 * @returns The result of the job.
	 */
	run<T>(job: () => T | Promise<T>): Promise<T> {
		const id = Symbol();

		return this.#wait(id)
			.then(job)
			.finally(() => this.#end(id));
	}

	/**
	 * Wrap a job with this rate limiter's `run()` method.
	 * @param job Job to wrap.
	 * @returns The wrapped job.
	 */
	wrap<T>(job: () => T | Promise<T>): () => Promise<T> {
		return () => this.run(job);
	}

	#end(hash: symbol): void {
		this.#running.delete(hash);
		this.#waiting.shift()?.();
	}

	async #wait(hash: symbol): Promise<void> {
		if (this.#running.size > 0) {
			await new Promise<void>((resolve) => {
				this.#waiting.push(resolve);
			});
		}

		this.#running.add(hash);

		while (Date.now() - this.#lastRun < this.#delayBetweenMs) {
			await new Promise((resolve) =>
				setTimeout(resolve, this.#delayBetweenMs - (Date.now() - this.#lastRun)),
			);
		}

		this.#lastRun = Date.now();
	}
}
