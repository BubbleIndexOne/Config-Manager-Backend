import { handleHealth } from "./routes/health";
import { handleApps } from "./routes/apps";
import { handleEnvironments } from "./routes/environments";
import { handleVariables } from "./routes/variables";
import {
	handleCreateSnapshot,
	handleListSnapshots,
	handleRestoreSnapshot,
} from "./routes/snapshots";
import { handleGitSync } from "./routes/git";
import { handleDocs } from "./routes/docs";
import { notFound } from "./utils/response";
import type { Env } from "./types";

/**
 * Lightweight URL pattern router for Cloudflare Workers.
 * Matches pathname segments and extracts named parameters.
 */
function matchPath(
	pattern: string,
	pathname: string,
): Record<string, string> | null {
	const patternParts = pattern.split("/");
	const pathParts = pathname.split("/");

	if (patternParts.length !== pathParts.length) return null;

	const params: Record<string, string> = {};

	for (let i = 0; i < patternParts.length; i++) {
		const p = patternParts[i];
		if (p.startsWith(":")) {
			params[p.slice(1)] = decodeURIComponent(pathParts[i]);
		} else if (p !== pathParts[i]) {
			return null;
		}
	}

	return params;
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const { pathname } = url;

		// ── Documentation ─────────────────────────────────────────────────
		if (pathname === "/docs" || pathname === "/docs/") {
			return handleDocs(request, env);
		}

		// ── System ──────────────────────────────────────────────────────────
		if (pathname === "/api/health") {
			return handleHealth(request, env);
		}

		// ── Applications ─────────────────────────────────────────────────────
		if (pathname === "/api/apps") {
			return handleApps(request, env);
		}

		// ── Environments ──────────────────────────────────────────────────────
		if (pathname === "/api/environments") {
			return handleEnvironments(request, env);
		}

		// ── Variables ─────────────────────────────────────────────────────────
		const variablesParams = matchPath(
			"/api/apps/:appId/environments/:envId/variables",
			pathname,
		);
		if (variablesParams) {
			return handleVariables(
				request,
				env,
				variablesParams.appId,
				variablesParams.envId,
			);
		}

		// ── Cloud Snapshots ───────────────────────────────────────────────────
		if (pathname === "/api/cloud/snapshot") {
			return handleCreateSnapshot(request, env);
		}

		if (pathname === "/api/cloud/snapshots") {
			return handleListSnapshots(request, env);
		}

		if (pathname === "/api/cloud/restore") {
			return handleRestoreSnapshot(request, env);
		}

		// ── Git Automation ────────────────────────────────────────────────────
		if (pathname === "/api/git/sync") {
			return handleGitSync(request, env);
		}

		return notFound();
	},
} satisfies ExportedHandler<Env>;
