// ─── Cloudflare Worker Env ──────────────────────────────────────────────────

export interface Env {
	DB: D1Database;
	API_KEY: string;
}

// ─── Domain Models (mirror OpenAPI schemas) ──────────────────────────────────

export interface ProjectApp {
	id: string;
	name: string;
	slug: string;
	description?: string;
	icon?: string;
	color?: string;
	createdAt: string;
}

export interface Environment {
	id: string;
	name: string;
	code: "development" | "preview" | "qa" | "staging" | "production";
	color?: string;
	description?: string;
	isLocked: boolean;
	cloudSyncEnabled: boolean;
	lastSyncedAt?: string;
}

export interface VariableHistoryEntry {
	id: string;
	version: number;
	value: string;
	isSecret: boolean;
	timestamp: string;
	author: string;
	changeType: "create" | "update_value" | "toggle_secret" | "rollback" | "imported";
	reason?: string;
	previousValue?: string | null;
	category?: string | null;
}

export interface ConfigVariable {
	id: string;
	appId: string;
	key: string;
	value: string;
	isSecret: boolean;
	category?: string;
	description?: string;
	updatedAt: string;
	updatedBy: string;
	currentVersion: number;
	history: VariableHistoryEntry[];
}

// ─── Request Bodies ──────────────────────────────────────────────────────────

export interface CreateAppBody {
	name: string;
	slug: string;
	description?: string;
	icon?: string;
	color?: string;
}

export interface UpsertVariableBody {
	key: string;
	value: string;
	isSecret: boolean;
	category?: string;
	description?: string;
	updatedBy: string;
	reason?: string;
}

export interface CreateSnapshotRequest {
	label: string;
	author?: string;
	environments: Environment[];
	apps?: ProjectApp[];
	variablesByEnv: Record<string, ConfigVariable[]>;
}

export interface GitSyncRequest {
	provider: "github" | "bitbucket";
	repoOwner: string;
	repoName: string;
	branch: string;
	token?: string;
	envCode?: string;
	environment?: string;
	action: "push" | "pull";
	syncTarget?: "repo_secrets" | "env_file" | "deployment_env";
	commitMessage?: string;
	variables: ConfigVariable[];
}

// ─── D1 Raw Row Types ────────────────────────────────────────────────────────

export interface AppRow {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	icon: string | null;
	color: string | null;
	created_at: string;
}

export interface EnvironmentRow {
	id: string;
	name: string;
	code: string;
	color: string | null;
	description: string | null;
	is_locked: number;
	cloud_sync_enabled: number;
	last_synced_at: string | null;
}

export interface ConfigVariableRow {
	id: string;
	app_id: string;
	env_id: string;
	key: string;
	value: string;
	is_secret: number;
	category: string | null;
	description: string | null;
	updated_at: string;
	updated_by: string;
	current_version: number;
}

export interface VariableHistoryRow {
	id: string;
	variable_id: string;
	version: number;
	value: string;
	is_secret: number;
	timestamp: string;
	author: string;
	change_type: string;
	reason: string | null;
	previous_value: string | null;
	category: string | null;
}

export interface CloudSnapshotRow {
	id: string;
	timestamp: string;
	label: string;
	environment_count: number;
	variable_count: number;
	author: string;
	data?: string;
}
