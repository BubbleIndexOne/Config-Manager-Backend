import { jsonOk, jsonError, methodNotAllowed } from "../utils/response";
import type { Env, GitSyncRequest, ConfigVariable } from "../types";

// ─── GitHub Contents API helper types ────────────────────────────────────────

interface GitHubFileResponse {
	sha?: string;
	content?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts an array of ConfigVariables into a .env file string.
 * Secret values are included as-is (the client owns masking responsibility).
 */
function variablesToEnvFile(variables: ConfigVariable[]): string {
	const lines = variables.map((v) => {
		const comment = v.description ? `# ${v.description}\n` : "";
		return `${comment}${v.key}=${v.value}`;
	});
	return lines.join("\n") + "\n";
}

/**
 * Parses a .env file string into a key-value record.
 */
function parseEnvFile(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		const val = trimmed.slice(eq + 1).trim();
		result[key] = val;
	}
	return result;
}

// ─── GitHub API calls ─────────────────────────────────────────────────────────

async function githubGetFile(
	owner: string,
	repo: string,
	branch: string,
	path: string,
	token: string,
): Promise<GitHubFileResponse | null> {
	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "config-manager-backend",
			},
		},
	);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
	return res.json<GitHubFileResponse>();
}

async function githubPutFile(
	owner: string,
	repo: string,
	branch: string,
	path: string,
	content: string,
	message: string,
	sha: string | undefined,
	token: string,
): Promise<{ commit: { sha: string } }> {
	const body: Record<string, unknown> = {
		message,
		content: btoa(content), // base64 encode for GitHub Contents API
		branch,
	};
	if (sha) body.sha = sha; // required when updating an existing file

	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"Content-Type": "application/json",
				"User-Agent": "config-manager-backend",
			},
			body: JSON.stringify(body),
		},
	);

	if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
	return res.json();
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * POST /api/git/sync
 * Pushes or pulls an .env file to/from a GitHub repository.
 *
 * NOTE: Only `syncTarget: "env_file"` is supported.
 * `repo_secrets` requires WASM libsodium (not available in Workers yet).
 */
async function syncGit(req: Request, _env: Env): Promise<Response> {
	let body: GitSyncRequest;
	try {
		body = await req.json<GitSyncRequest>();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	// Validate required fields
	if (!body.provider)   return jsonError("`provider` is required", 400);
	if (!body.repoOwner)  return jsonError("`repoOwner` is required", 400);
	if (!body.repoName)   return jsonError("`repoName` is required", 400);
	if (!body.branch)     return jsonError("`branch` is required", 400);
	if (!body.action)     return jsonError("`action` is required", 400);
	if (!body.token)      return jsonError("`token` is required for Git operations", 400);
	if (!Array.isArray(body.variables)) return jsonError("`variables` must be an array", 400);

	if (body.provider !== "github") {
		return jsonError("Only `provider: github` is currently supported", 400);
	}

	const syncTarget = body.syncTarget ?? "env_file";
	if (syncTarget !== "env_file") {
		return jsonError(
			"Only `syncTarget: env_file` is currently supported. `repo_secrets` requires WASM libsodium.",
			400,
		);
	}

	// Determine the .env file path in the repo
	const envCode = body.envCode ?? body.environment ?? "env";
	const filePath = `.env.${envCode}`;
	const commitMessage =
		body.commitMessage ?? `chore: sync ${envCode} config via config-manager`;
	const now = new Date().toISOString();

	try {
		if (body.action === "push") {
			// ── PUSH: write .env file to GitHub ────────────────────────────
			const envContent = variablesToEnvFile(body.variables);

			// Get current file SHA if it exists (required for updates)
			const existingFile = await githubGetFile(
				body.repoOwner,
				body.repoName,
				body.branch,
				filePath,
				body.token,
			);

			const result = await githubPutFile(
				body.repoOwner,
				body.repoName,
				body.branch,
				filePath,
				envContent,
				commitMessage,
				existingFile?.sha,
				body.token,
			);

			return jsonOk({
				success: true,
				provider: body.provider,
				repo: `${body.repoOwner}/${body.repoName}`,
				branch: body.branch,
				commitSha: result.commit.sha,
				commitMessage,
				syncedCount: body.variables.length,
				syncTarget,
				timestamp: now,
				syncedFile: filePath,
			});
		} else {
			// ── PULL: read .env file from GitHub ───────────────────────────
			const existingFile = await githubGetFile(
				body.repoOwner,
				body.repoName,
				body.branch,
				filePath,
				body.token,
			);

			if (!existingFile?.content) {
				return jsonError(
					`File "${filePath}" not found in ${body.repoOwner}/${body.repoName}@${body.branch}`,
					404,
				);
			}

			// GitHub returns base64-encoded content with newlines
			const raw = atob(existingFile.content.replace(/\n/g, ""));
			const kvPairs = parseEnvFile(raw);
			const syncedCount = Object.keys(kvPairs).length;

			return jsonOk({
				success: true,
				provider: body.provider,
				repo: `${body.repoOwner}/${body.repoName}`,
				branch: body.branch,
				commitSha: existingFile.sha ?? "",
				commitMessage: "",
				syncedCount,
				syncTarget,
				timestamp: now,
				syncedFile: filePath,
				// Return the parsed key-value pairs so the frontend can rehydrate
				pulledVariables: kvPairs,
			});
		}
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return jsonError(`Git sync failed: ${msg}`, 502);
	}
}

/** Route dispatcher for POST /api/git/sync */
export async function handleGitSync(req: Request, env: Env): Promise<Response> {
	if (req.method !== "POST") return methodNotAllowed();
	return syncGit(req, env);
}
