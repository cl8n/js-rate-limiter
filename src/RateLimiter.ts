declare global {
	// Declaring this here because it differs between browser and Node.js
	function setTimeout(handler: (...args: unknown[]) => void, timeout?: number): void;
}

interface QueueItem {
	hash: symbol;
	promise: Promise<void>;
	resolve: () => void;
}

/**
 * A basic rate limiter that waits a fixed amount of time between jobs (functions that return promises).
 */
export default class RateLimiter {
	#delayBetweenMs: number;
	#lastRun = Number.NEGATIVE_INFINITY;
	#running: QueueItem[] = [];
	#waiting: QueueItem[] = [];

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
		const itemIndex = this.#running.findIndex((x) => x.hash === hash);

		if (itemIndex === -1) {
			throw new Error("RateLimiter queue desync");
		}

		this.#running.splice(itemIndex, 1)[0].resolve();

		const nextItem = this.#waiting.shift();

		if (nextItem != null) {
			nextItem.resolve();
		}
	}

	async #wait(hash: symbol): Promise<void> {
		const item: Partial<QueueItem> = { hash };

		if (this.#running.length > 0) {
			item.promise = new Promise((resolve) => {
				item.resolve = resolve;
			});

			this.#waiting.push(item as QueueItem);
			await item.promise;
		}

		item.promise = new Promise((resolve) => {
			item.resolve = resolve;
		});

		this.#running.push(item as QueueItem);

		while (Date.now() - this.#lastRun < this.#delayBetweenMs) {
			await new Promise((resolve) =>
				setTimeout(resolve, this.#delayBetweenMs - (Date.now() - this.#lastRun)),
			);
		}

		this.#lastRun = Date.now();
	}
}
