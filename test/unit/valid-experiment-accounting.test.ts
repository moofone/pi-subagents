import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	createValidExperimentAccounting,
	recordValidExperimentDispatch,
} from "../../src/observability/valid-experiment-accounting.ts";

describe("valid experiment dispatch accounting", () => {
	it("starts with frozen parent and retry counters", () => {
		const accounting = createValidExperimentAccounting();

		assert.deepEqual(accounting, { parentDispatches: 0, retryDispatches: 0 });
		assert.equal(Object.isFrozen(accounting), true);
	});

	it("records parent and retry dispatches in independent frozen snapshots", () => {
		const initial = createValidExperimentAccounting();
		const parent = recordValidExperimentDispatch(initial, "parent");
		const retry = recordValidExperimentDispatch(parent, "retry");

		assert.deepEqual(initial, { parentDispatches: 0, retryDispatches: 0 });
		assert.deepEqual(parent, { parentDispatches: 1, retryDispatches: 0 });
		assert.deepEqual(retry, { parentDispatches: 1, retryDispatches: 1 });
		assert.equal(Object.isFrozen(parent), true);
		assert.equal(Object.isFrozen(retry), true);
	});

	it("rejects an unknown dispatch kind without changing the accounting", () => {
		const accounting = createValidExperimentAccounting();

		assert.throws(
			() => recordValidExperimentDispatch(accounting, "other" as "parent"),
			/Unknown valid experiment dispatch kind/,
		);
		assert.deepEqual(accounting, { parentDispatches: 0, retryDispatches: 0 });
	});
});
