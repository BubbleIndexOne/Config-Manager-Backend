-- Migration: 0000_initial_schema
-- Target: Cloudflare D1 (SQLite)

-- 1. Applications (ProjectApp)
-- Maps to the ProjectApp component schema.
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Environments
-- Enforces isolation by defining the strict environment bounds.
CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL CHECK(code IN ('development', 'preview', 'qa', 'staging', 'production')),
    color TEXT,
    description TEXT,
    is_locked INTEGER NOT NULL DEFAULT 0, -- Boolean: 0=false, 1=true
    cloud_sync_enabled INTEGER NOT NULL DEFAULT 1, -- Boolean: 0=false, 1=true
    last_synced_at TEXT
);

-- 3. Configuration Variables
-- Binds a configuration key-value pair strictly to an App AND an Environment.
CREATE TABLE IF NOT EXISTS config_variables (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    env_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    is_secret INTEGER NOT NULL DEFAULT 0, -- Boolean
    category TEXT,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    
    FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
    FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE,
    
    -- Crucial for isolation: An app can only have one instance of a specific key per environment
    UNIQUE (app_id, env_id, key)
);

-- Index to optimize querying all variables for a specific app's environment 
CREATE INDEX IF NOT EXISTS idx_config_vars_app_env ON config_variables(app_id, env_id);

-- 4. Variable History (Audit Ledger)
-- Immutable ledger mapping to VariableHistoryEntry.
CREATE TABLE IF NOT EXISTS variable_history (
    id TEXT PRIMARY KEY,
    variable_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    value TEXT NOT NULL,
    is_secret INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK(change_type IN ('create', 'update_value', 'toggle_secret', 'rollback', 'imported')),
    reason TEXT,
    previous_value TEXT,
    category TEXT,
    
    FOREIGN KEY (variable_id) REFERENCES config_variables(id) ON DELETE CASCADE
);

-- Index to quickly pull the audit trail for a single variable
CREATE INDEX IF NOT EXISTS idx_var_history_var_id ON variable_history(variable_id);

-- 5. Cloud Snapshots
-- Stores the point-in-time JSON payload for disaster recovery and rollbacks.
CREATE TABLE IF NOT EXISTS cloud_snapshots (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    label TEXT NOT NULL,
    environment_count INTEGER NOT NULL,
    variable_count INTEGER NOT NULL,
    author TEXT NOT NULL,
    -- D1 does not have a native JSONB type, so the snapshot payload is stored as TEXT.
    -- You can use SQLite's built-in JSON functions (e.g., json_extract) to query this if needed.
    data TEXT NOT NULL 
);