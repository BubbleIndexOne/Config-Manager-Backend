import { jsonOk, jsonError, methodNotAllowed } from "../utils/response";
import { newId } from "../utils/id";
import { mapVariable } from "../utils/mappers";
import type {
	Env,
	UpsertVariableBody,
	ConfigVariableRow,
	VariableHistoryRow,
} from "../types";

/**
 * GET /api/apps/:appId/environments/:envId/variables
 * Returns all config variables for a given app+env, with embedded history.
 */
async function listVariables(
	_req: Request,
	env: Env,
	appId: string,
	envId: string,
): Promise<Response> {
	const { results: varRows } = await env.DB.prepare(
		`SELECT * FROM config_variables WHERE app_id = ? AND env_id = ? ORDER BY key ASC`
	)
		.bind(appId, envId)
		.all<ConfigVariableRow>();

	if (!varRows || varRows.length === 0) return jsonOk([]);

	// Fetch history for all variables in one batch query
	const ids = varRows.map((r) => r.id);
	const placeholders = ids.map(() => "?").join(", ");

	const { results: histRows } = await env.DB.prepare(
		`SELECT * FROM variable_history WHERE variable_id IN (${placeholders}) ORDER BY version DESC`
	)
		.bind(...ids)
		.all<VariableHistoryRow>();

	// Group history rows by variable_id
	const historyByVar = new Map<string, VariableHistoryRow[]>();
	for (const h of histRows ?? []) {
		const bucket = historyByVar.get(h.variable_id) ?? [];
		bucket.push(h);
		historyByVar.set(h.variable_id, bucket);
	}

	const variables = varRows.map((row) =>
		mapVariable(row, historyByVar.get(row.id) ?? [])
	);

	return jsonOk(variables);
}

/**
 * POST /api/apps/:appId/environments/:envId/variables
 * Upserts a config variable (create or update) and writes an immutable history entry.
 * Uses D1 batch() for atomic execution.
 */
async function upsertVariable(
	req: Request,
	env: Env,
	appId: string,
	envId: string,
): Promise<Response> {
	let body: UpsertVariableBody;
	try {
		body = await req.json<UpsertVariableBody>();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	if (!body.key?.trim())       return jsonError("`key` is required", 400);
	if (body.value === undefined) return jsonError("`value` is required", 400);
	if (body.isSecret === undefined) return jsonError("`isSecret` is required", 400);
	if (!body.updatedBy?.trim()) return jsonError("`updatedBy` is required", 400);

	const now = new Date().toISOString();
	const isSecretInt = body.isSecret ? 1 : 0;

	// Check if the variable already exists
	const existing = await env.DB.prepare(
		`SELECT * FROM config_variables WHERE app_id = ? AND env_id = ? AND key = ?`
	)
		.bind(appId, envId, body.key.trim())
		.first<ConfigVariableRow>();

	const historyId = newId();

	if (!existing) {
		// ── INSERT ─────────────────────────────────────────────────────────────
		const varId = newId();

		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO config_variables (id, app_id, env_id, key, value, is_secret, category, description, updated_at, updated_by, current_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
			).bind(
				varId,
				appId,
				envId,
				body.key.trim(),
				body.value,
				isSecretInt,
				body.category ?? null,
				body.description ?? null,
				now,
				body.updatedBy.trim(),
			),
			env.DB.prepare(
				`INSERT INTO variable_history (id, variable_id, version, value, is_secret, timestamp, author, change_type, reason, previous_value, category)
         VALUES (?, ?, 1, ?, ?, ?, ?, 'create', ?, NULL, ?)`
			).bind(
				historyId,
				varId,
				body.value,
				isSecretInt,
				now,
				body.updatedBy.trim(),
				body.reason ?? null,
				body.category ?? null,
			),
		]);

		const row = await env.DB.prepare(
			`SELECT * FROM config_variables WHERE id = ?`
		).bind(varId).first<ConfigVariableRow>();

		const { results: hist } = await env.DB.prepare(
			`SELECT * FROM variable_history WHERE variable_id = ? ORDER BY version DESC`
		).bind(varId).all<VariableHistoryRow>();

		return jsonOk(mapVariable(row!, hist ?? []));
	} else {
		// ── UPDATE ─────────────────────────────────────────────────────────────
		const newVersion = existing.current_version + 1;

		// Determine the change_type
		let changeType: "update_value" | "toggle_secret" = "update_value";
		if (existing.value === body.value && existing.is_secret !== isSecretInt) {
			changeType = "toggle_secret";
		}

		await env.DB.batch([
			env.DB.prepare(
				`UPDATE config_variables
         SET value = ?, is_secret = ?, category = ?, description = ?,
             updated_at = ?, updated_by = ?, current_version = ?
         WHERE id = ?`
			).bind(
				body.value,
				isSecretInt,
				body.category ?? existing.category,
				body.description ?? existing.description,
				now,
				body.updatedBy.trim(),
				newVersion,
				existing.id,
			),
			env.DB.prepare(
				`INSERT INTO variable_history (id, variable_id, version, value, is_secret, timestamp, author, change_type, reason, previous_value, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			).bind(
				historyId,
				existing.id,
				newVersion,
				body.value,
				isSecretInt,
				now,
				body.updatedBy.trim(),
				changeType,
				body.reason ?? null,
				existing.value,
				body.category ?? existing.category,
			),
		]);

		const row = await env.DB.prepare(
			`SELECT * FROM config_variables WHERE id = ?`
		).bind(existing.id).first<ConfigVariableRow>();

		const { results: hist } = await env.DB.prepare(
			`SELECT * FROM variable_history WHERE variable_id = ? ORDER BY version DESC`
		).bind(existing.id).all<VariableHistoryRow>();

		return jsonOk(mapVariable(row!, hist ?? []));
	}
}

/** Route dispatcher for /api/apps/:appId/environments/:envId/variables */
export async function handleVariables(
	req: Request,
	env: Env,
	appId: string,
	envId: string,
): Promise<Response> {
	switch (req.method) {
		case "GET":  return listVariables(req, env, appId, envId);
		case "POST": return upsertVariable(req, env, appId, envId);
		default:     return methodNotAllowed();
	}
}
