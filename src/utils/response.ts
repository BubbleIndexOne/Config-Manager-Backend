/**
 * Shared JSON response helpers for Cloudflare Workers.
 * All responses include the appropriate Content-Type header.
 */

const JSON_HEADERS = { "content-type": "application/json" };

/** Return a 200 (or custom status) JSON response. */
export function jsonOk(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

/** Return a 4xx / 5xx JSON error response. */
export function jsonError(message: string, status = 400): Response {
	return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

/** Return a 404 Not Found JSON response. */
export function notFound(): Response {
	return jsonError("Not found", 404);
}

/** Return a 405 Method Not Allowed response. */
export function methodNotAllowed(): Response {
	return jsonError("Method not allowed", 405);
}
