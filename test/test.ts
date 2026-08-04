import * as assert from "node:assert/strict";
import { test } from "node:test";
import RateLimiter from "../src/RateLimiter.ts";

test("waits between jobs", async (t) => {
	t.mock.timers.enable();

	const ms = 1000;
	const limiter = new RateLimiter(ms);

	const job = t.mock.fn();
	const promises = [limiter.run(job), limiter.run(job), limiter.run(job)];

	await promises[0];
	assert.strictEqual(job.mock.callCount(), 1);

	t.mock.timers.tick(ms);
	await promises[1];
	assert.strictEqual(job.mock.callCount(), 2);

	t.mock.timers.tick(ms);
	await promises[2];
	assert.strictEqual(job.mock.callCount(), 3);
});

test("advance() clears delay", async (t) => {
	t.mock.timers.enable();

	const ms = 1000;
	const limiter = new RateLimiter(ms);

	const job = t.mock.fn();
	const promises = [limiter.run(job), limiter.run(job), limiter.run(job)];

	await promises[0];
	assert.strictEqual(job.mock.callCount(), 1);

	limiter.advance();
	await promises[1];
	assert.strictEqual(job.mock.callCount(), 2);

	limiter.advance();
	await promises[2];
	assert.strictEqual(job.mock.callCount(), 3);
});
