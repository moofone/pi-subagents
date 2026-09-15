interface CompletionDataLike {
	id?: unknown;
	agent?: unknown;
	timestamp?: unknown;
	sessionId?: unknown;
	state?: unknown;
	taskIndex?: unknown;
	totalTasks?: unknown;
	success?: unknown;
	continuation?: unknown;
	continuationEvent?: unknown;
	handoffContinuation?: unknown;
}

function asNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
	if (typeof value !== "number") return undefined;
	return Number.isFinite(value) ? value : undefined;
}

export function buildCompletionKey(data: CompletionDataLike, fallback: string): string {
	const sessionId = asNonEmptyString(data.sessionId) ?? "no-session";
	const id = asNonEmptyString(data.id);
	const state = asNonEmptyString(data.state);
	const continuation = continuationIdentity(data);
	const suffix = continuation ? `:continuation:${continuation}` : "";
	if (id) return state
		? `session:${sessionId}:id:${id}:state:${state}${suffix}`
		: `session:${sessionId}:id:${id}${suffix}`;
	const agent = asNonEmptyString(data.agent) ?? "unknown";
	const timestamp = asFiniteNumber(data.timestamp);
	const taskIndex = asFiniteNumber(data.taskIndex);
	const totalTasks = asFiniteNumber(data.totalTasks);
	const success = typeof data.success === "boolean" ? (data.success ? "1" : "0") : "?";
	return [
		"meta",
		sessionId,
		agent,
		timestamp !== undefined ? String(timestamp) : "no-ts",
		taskIndex !== undefined ? String(taskIndex) : "-",
		totalTasks !== undefined ? String(totalTasks) : "-",
		success,
		fallback,
		...(continuation ? ["continuation", continuation] : []),
	].join(":");
}

function continuationIdentity(data: CompletionDataLike): string | undefined {
	const event = data.handoffContinuation ?? data.continuationEvent;
	if (event && typeof event === "object" && !Array.isArray(event)) {
		const value = event as Record<string, unknown>;
		const eventId = asNonEmptyString(value.eventId) ?? asNonEmptyString(value.id);
		const sourceRunId = asNonEmptyString(value.sourceRunId);
		const runId = asNonEmptyString(value.runId);
		const kind = asNonEmptyString(value.kind);
		const sequence = asFiniteNumber(value.sequence);
		if (eventId || sourceRunId || runId || kind || sequence !== undefined) {
			return ["event", eventId ?? "no-id", sourceRunId ?? "no-source", runId ?? "no-run", kind ?? "continuation", sequence !== undefined ? String(sequence) : "no-sequence"].join("/");
		}
	}
	const lineage = data.continuation;
	if (lineage && typeof lineage === "object" && !Array.isArray(lineage)) {
		const runIds = (lineage as Record<string, unknown>).runIds;
		if (Array.isArray(runIds)) {
			const normalized = runIds.filter((runId): runId is string => typeof runId === "string" && Boolean(runId.trim())).map((runId) => runId.trim());
			if (normalized.length) return ["lineage", ...normalized].join("/");
		}
	}
	return undefined;
}

function pruneSeenMap(seen: Map<string, number>, now: number, ttlMs: number): void {
	for (const [key, ts] of seen.entries()) {
		if (now - ts > ttlMs) seen.delete(key);
	}
}

export function markSeenWithTtl(seen: Map<string, number>, key: string, now: number, ttlMs: number): boolean {
	pruneSeenMap(seen, now, ttlMs);
	if (seen.has(key)) return true;
	seen.set(key, now);
	return false;
}
