import { jsonOk, jsonError, methodNotAllowed } from "../utils/response";
import { newId } from "../utils/id";
import { mapApp } from "../utils/mappers";
import type { Env, CreateAppBody, AppRow } from "../types";

/**
 * GET /api/apps
 * Returns a list of all registered applications.
 */
async function listApps(_req: Request, env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT * FROM apps ORDER BY created_at DESC`
	).all<AppRow>();

	return jsonOk((results ?? []).map(mapApp));
}

/**
 * POST /api/apps
 * Creates a new application. Requires `name` and `slug`.
 */
async function createApp(req: Request, env: Env): Promise<Response> {
	let body: CreateAppBody;

	try {
		body = await req.json<CreateAppBody>();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	if (!body.name?.trim()) return jsonError("`name` is required", 400);
	if (!body.slug?.trim()) return jsonError("`slug` is required", 400);

	const id = newId();
	const now = new Date().toISOString();

	try {
		await env.DB.prepare(
			`INSERT INTO apps (id, name, slug, description, icon, color, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				id,
				body.name.trim(),
				body.slug.trim(),
				body.description ?? null,
				body.icon ?? null,
				body.color ?? null,
				now,
			)
			.run();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		// Surface unique constraint violation as a friendly 409
		if (msg.includes("UNIQUE") || msg.includes("unique")) {
			return jsonError(`An app with slug "${body.slug}" already exists`, 409);
		}
		throw err;
	}

	const row = await env.DB.prepare(`SELECT * FROM apps WHERE id = ?`)
		.bind(id)
		.first<AppRow>();

	return jsonOk(mapApp(row!), 201);
}

/** Route dispatcher for /api/apps */
export async function handleApps(req: Request, env: Env): Promise<Response> {
	switch (req.method) {
		case "GET":  return listApps(req, env);
		case "POST": return createApp(req, env);
		default:     return methodNotAllowed();
	}
}
