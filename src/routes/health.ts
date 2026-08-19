import { jsonOk } from "../utils/response";
import type { Env } from "../types";

/**
 * GET /api/health
 * Returns service liveness status and current UTC timestamp.
 */
export async function handleHealth(_req: Request, _env: Env): Promise<Response> {
	return jsonOk({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "config-manager-backend",
	});
}
