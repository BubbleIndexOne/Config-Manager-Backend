import type {
	AppRow,
	EnvironmentRow,
	ConfigVariableRow,
	VariableHistoryRow,
	CloudSnapshotRow,
	ProjectApp,
	Environment,
	ConfigVariable,
	VariableHistoryEntry,
} from "../types";

/** Maps a raw D1 `apps` row → `ProjectApp` (camelCase, no nulls). */
export function mapApp(row: AppRow): ProjectApp {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		...(row.description != null && { description: row.description }),
		...(row.icon != null && { icon: row.icon }),
		...(row.color != null && { color: row.color }),
		createdAt: row.created_at,
	};
}

/** Maps a raw D1 `environments` row → `Environment`. */
export function mapEnvironment(row: EnvironmentRow): Environment {
	return {
		id: row.id,
		name: row.name,
		code: row.code as Environment["code"],
		...(row.color != null && { color: row.color }),
		...(row.description != null && { description: row.description }),
		isLocked: row.is_locked === 1,
		cloudSyncEnabled: row.cloud_sync_enabled === 1,
		...(row.last_synced_at != null && { lastSyncedAt: row.last_synced_at }),
	};
}

/** Maps a raw D1 `variable_history` row → `VariableHistoryEntry`. */
export function mapHistoryEntry(row: VariableHistoryRow): VariableHistoryEntry {
	return {
		id: row.id,
		version: row.version,
		value: row.value,
		isSecret: row.is_secret === 1,
		timestamp: row.timestamp,
		author: row.author,
		changeType: row.change_type as VariableHistoryEntry["changeType"],
		reason: row.reason ?? undefined,
		previousValue: row.previous_value,
		category: row.category,
	};
}

/** Maps a raw D1 `config_variables` row + history rows → `ConfigVariable`. */
export function mapVariable(
	row: ConfigVariableRow,
	history: VariableHistoryRow[],
): ConfigVariable {
	return {
		id: row.id,
		appId: row.app_id,
		key: row.key,
		value: row.value,
		isSecret: row.is_secret === 1,
		...(row.category != null && { category: row.category }),
		...(row.description != null && { description: row.description }),
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
		currentVersion: row.current_version,
		history: history.map(mapHistoryEntry),
	};
}

/** Maps a raw D1 `cloud_snapshots` row (without data blob) → snapshot metadata object. */
export function mapSnapshotMeta(row: CloudSnapshotRow) {
	return {
		id: row.id,
		timestamp: row.timestamp,
		label: row.label,
		environmentCount: row.environment_count,
		variableCount: row.variable_count,
		author: row.author,
	};
}

/** Maps a raw D1 `cloud_snapshots` row (with data blob) → full snapshot object. */
export function mapSnapshotFull(row: CloudSnapshotRow) {
	return {
		...mapSnapshotMeta(row),
		data: row.data ? JSON.parse(row.data) : null,
	};
}
