/** The two dispatch paths accounted for by a valid experiment. */
export const VALID_EXPERIMENT_DISPATCH_KINDS = ["parent", "retry"] as const;

export type ValidExperimentDispatchKind = (typeof VALID_EXPERIMENT_DISPATCH_KINDS)[number];

/** Immutable counters for accepted parent and retry dispatches. */
export interface ValidExperimentAccounting {
	readonly parentDispatches: number;
	readonly retryDispatches: number;
}

function freezeAccounting(parentDispatches: number, retryDispatches: number): ValidExperimentAccounting {
	return Object.freeze({ parentDispatches, retryDispatches });
}

export function createValidExperimentAccounting(): ValidExperimentAccounting {
	return freezeAccounting(0, 0);
}

/**
 * Add one accepted dispatch without mutating the prior accounting snapshot.
 * Every returned snapshot is frozen so counters cannot drift after recording.
 */
export function recordValidExperimentDispatch(
	accounting: ValidExperimentAccounting,
	kind: ValidExperimentDispatchKind,
): ValidExperimentAccounting {
	switch (kind) {
		case "parent":
			return freezeAccounting(accounting.parentDispatches + 1, accounting.retryDispatches);
		case "retry":
			return freezeAccounting(accounting.parentDispatches, accounting.retryDispatches + 1);
		default:
			throw new TypeError(`Unknown valid experiment dispatch kind: ${String(kind)}`);
	}
}
