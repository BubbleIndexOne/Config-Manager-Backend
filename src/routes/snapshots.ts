import { jsonOk, jsonError, methodNotAllowed } from "../utils/response";
import { newId } from "../utils/id";
import { mapSnapshotMeta, mapSnapshotFull } from "../utils/mappers";
import type { Env, CreateSnapshotRequest, CloudSnapshotRow } from "../types";

/**
 * POST /api/cloud/snapshot
 * Serializes the entire config state into a JSON blob and persists it as a snapshot.
 */
async function createSnapshot(req: Request, env: Env): Promise<Response> {
	let body: CreateSnapshotRequest;
	try {
		body = await req.json<CreateSnapshotRequest>();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	if (!body.label?.trim())              return jsonError("`label` is required", 400);
	if (!Array.isArray(body.environments)) return jsonError("`environments` must be an array", 400);
	if (!body.variablesByEnv || typeof body.variablesByEnv !== "object") {
		return jsonError("`variablesByEnv` is required", 400);
	}

	const id = newId();
	const now = new Date().toISOString();

	const environmentCount = body.environments.length;
	const variableCount = Object.values(body.variablesByEnv).reduce(
		(sum, vars) => sum + vars.length,
		0,
	);

	const data = JSON.stringify({
		environments: body.environments,
		apps: body.apps ?? [],
		variablesByEnv: body.variablesByEnv,
	});

	await env.DB.prepare(
		`INSERT INTO cloud_snapshots (id, timestamp, label, environment_count, variable_count, author, data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			id,
			now,
			body.label.trim(),
			environmentCount,
			variableCount,
			body.author ?? "system",
			data,
		)
		.run();

	const row = await env.DB.prepare(
		`SELECT * FROM cloud_snapshots WHERE id = ?`
	).bind(id).first<CloudSnapshotRow>();

	// Count total snapshots for the response
	const countRow = await env.DB.prepare(
		`SELECT COUNT(*) as total FROM cloud_snapshots`
	).first<{ total: number }>();

	return jsonOk({
		success: true,
		snapshot: mapSnapshotFull(row!),
		totalSnapshots: countRow?.total ?? 1,
	});
}

/**
 * GET /api/cloud/snapshots
 * Returns snapshot metadata list (without data blobs) ordered newest first.
 */
async function listSnapshots(_req: Request, env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, timestamp, label, environment_count, variable_count, author
     FROM cloud_snapshots
     ORDER BY timestamp DESC`
	).all<CloudSnapshotRow>();

	return jsonOk({
		success: true,
		snapshots: (results ?? []).map(mapSnapshotMeta),
	});
}

/**
 * POST /api/cloud/restore
 * Fetches and returns a snapshot's full payload by ID.
 * The frontend is responsible for rehydrating variables from the returned data.
 */
async function restoreSnapshot(req: Request, env: Env): Promise<Response> {
	let body: { snapshotId: string };
	try {
		body = await req.json();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	if (!body.snapshotId?.trim()) return jsonError("`snapshotId` is required", 400);

	const row = await env.DB.prepare(
		`SELECT * FROM cloud_snapshots WHERE id = ?`
	).bind(body.snapshotId.trim()).first<CloudSnapshotRow>();

	if (!row) {
		return jsonError(`Snapshot "${body.snapshotId}" not found`, 404);
	}

	return jsonOk({
		success: true,
		snapshot: mapSnapshotFull(row),
	});
}

/** Route dispatcher for snapshot routes */
export async function handleCreateSnapshot(req: Request, env: Env): Promise<Response> {
	if (req.method !== "POST") return methodNotAllowed();
	return createSnapshot(req, env);
}

export async function handleListSnapshots(req: Request, env: Env): Promise<Response> {
	if (req.method !== "GET") return methodNotAllowed();
	return listSnapshots(req, env);
}

export async function handleRestoreSnapshot(req: Request, env: Env): Promise<Response> {
	if (req.method !== "POST") return methodNotAllowed();
	return restoreSnapshot(req, env);
}
