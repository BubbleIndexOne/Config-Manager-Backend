import { jsonOk, methodNotAllowed } from "../utils/response";
import { mapEnvironment } from "../utils/mappers";
import type { Env, EnvironmentRow } from "../types";

/**
 * GET /api/environments
 * Returns all global environments ordered by their enum position.
 */
async function listEnvironments(_req: Request, env: Env): Promise<Response> {
	// Order by a defined enum sequence so the response is always predictable
	const ORDER = `CASE code
    WHEN 'development' THEN 1
    WHEN 'preview'     THEN 2
    WHEN 'qa'          THEN 3
    WHEN 'staging'     THEN 4
    WHEN 'production'  THEN 5
    ELSE 6
  END`;

	const { results } = await env.DB.prepare(
		`SELECT * FROM environments ORDER BY ${ORDER}`
	).all<EnvironmentRow>();

	return jsonOk((results ?? []).map(mapEnvironment));
}

/** Route dispatcher for /api/environments */
export async function handleEnvironments(req: Request, env: Env): Promise<Response> {
	switch (req.method) {
		case "GET": return listEnvironments(req, env);
		default:    return methodNotAllowed();
	}
}
