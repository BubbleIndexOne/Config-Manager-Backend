import { jsonError } from "./response";
import type { Env } from "../types";

/**
 * Validates the request against the configured API_KEY.
 * Checks both the Authorization header (Bearer token) and the x-api-key header.
 * 
 * @returns null if authenticated, or a Response (401 Unauthorized) if failed.
 */
export function requireAuth(req: Request, env: Env): Response | null {
	// If API_KEY is not configured in the environment, we log a warning and block access
	// to prevent accidental exposure of the API.
	if (!env.API_KEY) {
		console.warn("WARNING: API_KEY is not configured in the environment.");
		return jsonError("Server configuration error", 500);
	}

	const authHeader = req.headers.get("Authorization");
	const apiKeyHeader = req.headers.get("x-api-key");

	let token = "";

	if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
		token = authHeader.slice(7).trim();
	} else if (apiKeyHeader) {
		token = apiKeyHeader.trim();
	}

	if (!token) {
		return jsonError("Missing authentication token", 401);
	}

	if (token !== env.API_KEY) {
		return jsonError("Invalid authentication token", 401);
	}

	// Authenticated
	return null;
}
