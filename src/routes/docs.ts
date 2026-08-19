import type { Env } from "../types";

const SWAGGER_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CloudEnv API — Swagger UI</title>
    <meta name="description" content="Interactive API documentation for the CloudEnv Multi-Environment Secret & Configuration Management API." />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      /* ── Reset & Base ─────────────────────────────────────────── */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --bg:           #0d0f14;
        --surface:      #151820;
        --surface-2:    #1c2030;
        --border:       #262c3e;
        --accent:       #6c8aff;
        --accent-hover: #8fa5ff;
        --success:      #34d399;
        --warning:      #fbbf24;
        --danger:       #f87171;
        --text:         #e2e8f0;
        --text-muted:   #7b8399;
        --font:         'Inter', system-ui, -apple-system, sans-serif;
        --radius:       10px;
      }

      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font); }

      /* ── Top nav bar ──────────────────────────────────────────── */
      .nav {
        position: sticky; top: 0; z-index: 100;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 2rem; height: 60px;
        background: rgba(13, 15, 20, 0.85);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--border);
      }
      .nav-brand {
        display: flex; align-items: center; gap: 10px;
        font-weight: 700; font-size: 1.05rem; letter-spacing: -.3px;
      }
      .nav-brand svg { width: 28px; height: 28px; }
      .nav-pill {
        font-size: 0.7rem; font-weight: 600; letter-spacing: .5px;
        background: linear-gradient(135deg, #6c8aff22, #a78bfa22);
        color: var(--accent); border: 1px solid #6c8aff44;
        padding: 3px 10px; border-radius: 999px;
      }
      .nav-links { display: flex; gap: 1.2rem; align-items: center; }
      .nav-links a {
        font-size: .85rem; color: var(--text-muted); text-decoration: none;
        transition: color .2s;
      }
      .nav-links a:hover { color: var(--accent); }

      /* ── Hero banner ──────────────────────────────────────────── */
      .hero {
        padding: 3rem 2rem 2rem;
        background: radial-gradient(ellipse 80% 60% at 50% -20%, #6c8aff18, transparent);
        border-bottom: 1px solid var(--border);
        text-align: center;
      }
      .hero h1 {
        font-size: clamp(1.6rem, 3vw, 2.4rem);
        font-weight: 700; letter-spacing: -.5px;
        background: linear-gradient(135deg, #e2e8f0, #6c8aff);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .hero p {
        margin: .6rem auto 0; max-width: 560px;
        color: var(--text-muted); font-size: .95rem; line-height: 1.6;
      }
      .hero-badges {
        display: flex; justify-content: center; gap: .6rem; margin-top: 1.2rem;
        flex-wrap: wrap;
      }
      .badge {
        font-size: .72rem; font-weight: 600; padding: 4px 12px;
        border-radius: 999px; border: 1px solid;
      }
      .badge-blue   { color: #6c8aff; border-color: #6c8aff44; background: #6c8aff11; }
      .badge-green  { color: #34d399; border-color: #34d39944; background: #34d39911; }
      .badge-orange { color: #fbbf24; border-color: #fbbf2444; background: #fbbf2411; }

      /* ── Swagger UI container ─────────────────────────────────── */
      #swagger-ui {
        max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem;
      }

      /* ── Swagger UI theme overrides ───────────────────────────── */
      .swagger-ui { font-family: var(--font) !important; color: var(--text) !important; }

      /* Topbar */
      .swagger-ui .topbar { display: none; }

      /* Info block */
      .swagger-ui .info .title { color: var(--text) !important; font-size: 1.4rem !important; }
      .swagger-ui .info p, .swagger-ui .info li,
      .swagger-ui .info a { color: var(--text-muted) !important; }
      .swagger-ui .info a { color: var(--accent) !important; }

      /* Scheme box */
      .swagger-ui .scheme-container {
        background: var(--surface) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius) !important;
        box-shadow: none !important;
        padding: 1rem !important;
        margin-bottom: 1.5rem !important;
      }

      /* Sections */
      .swagger-ui .opblock-tag {
        color: var(--text) !important;
        border-bottom: 1px solid var(--border) !important;
        font-size: 1.05rem !important; font-weight: 600 !important;
      }
      .swagger-ui .opblock-tag:hover { background: var(--surface-2) !important; }
      .swagger-ui .opblock-tag-section { background: transparent !important; }

      /* Operation blocks */
      .swagger-ui .opblock {
        background: var(--surface) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius) !important;
        box-shadow: none !important;
        margin-bottom: .6rem !important;
        transition: border-color .2s !important;
      }
      .swagger-ui .opblock:hover { border-color: var(--accent) !important; }

      /* Method colours */
      .swagger-ui .opblock.opblock-get    { border-left: 3px solid var(--success) !important; }
      .swagger-ui .opblock.opblock-post   { border-left: 3px solid var(--accent)  !important; }
      .swagger-ui .opblock.opblock-put    { border-left: 3px solid var(--warning)  !important; }
      .swagger-ui .opblock.opblock-delete { border-left: 3px solid var(--danger)   !important; }
      .swagger-ui .opblock.opblock-patch  { border-left: 3px solid #a78bfa         !important; }

      .swagger-ui .opblock .opblock-summary {
        background: transparent !important;
        border-bottom: 1px solid var(--border) !important;
      }
      .swagger-ui .opblock .opblock-summary-method {
        border-radius: 6px !important; font-weight: 700 !important;
        min-width: 68px !important; text-align: center !important;
      }
      .swagger-ui .opblock-get    .opblock-summary-method { background: var(--success) !important; }
      .swagger-ui .opblock-post   .opblock-summary-method { background: var(--accent)  !important; }
      .swagger-ui .opblock-put    .opblock-summary-method { background: var(--warning)  !important; }
      .swagger-ui .opblock-delete .opblock-summary-method { background: var(--danger)   !important; }
      .swagger-ui .opblock-patch  .opblock-summary-method { background: #a78bfa         !important; }

      .swagger-ui .opblock-summary-description,
      .swagger-ui .opblock-summary-path { color: var(--text) !important; }

      /* Expanded body */
      .swagger-ui .opblock-body,
      .swagger-ui .opblock-section-header,
      .swagger-ui .tab { background: transparent !important; }

      .swagger-ui .opblock-description-wrapper p,
      .swagger-ui .response-col_description p,
      .swagger-ui table.headers td,
      .swagger-ui .parameter__name,
      .swagger-ui .parameter__type,
      .swagger-ui label { color: var(--text-muted) !important; }

      /* Code / model boxes */
      .swagger-ui .highlight-code,
      .swagger-ui .microlight,
      .swagger-ui .model-box,
      .swagger-ui section.models { background: var(--surface-2) !important; }

      .swagger-ui .model-container,
      .swagger-ui .model-title,
      .swagger-ui .model { color: var(--text) !important; }

      /* Inputs */
      .swagger-ui input[type=text],
      .swagger-ui textarea,
      .swagger-ui select {
        background: var(--surface-2) !important;
        border: 1px solid var(--border) !important;
        color: var(--text) !important;
        border-radius: 6px !important;
      }

      /* Execute button */
      .swagger-ui .btn.execute {
        background: var(--accent) !important;
        border-color: var(--accent) !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
        transition: background .2s !important;
      }
      .swagger-ui .btn.execute:hover { background: var(--accent-hover) !important; }

      /* Authorize button */
      .swagger-ui .btn.authorize {
        color: var(--accent) !important;
        border-color: var(--accent) !important;
        border-radius: 6px !important;
      }

      /* Response codes */
      .swagger-ui .response-col_status { color: var(--success) !important; }
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th { color: var(--text-muted) !important; border-color: var(--border) !important; }

      /* Models section */
      .swagger-ui section.models { border: 1px solid var(--border) !important; border-radius: var(--radius) !important; }
      .swagger-ui section.models h4 { color: var(--text) !important; }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--bg); }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--accent); }
    </style>
  </head>
  <body>

    <!-- ── Nav ────────────────────────────────────────────────── -->
    <nav class="nav">
      <div class="nav-brand">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#6c8aff22"/>
          <path d="M8 16C8 11.582 11.582 8 16 8s8 3.582 8 8-3.582 8-8 8" stroke="#6c8aff" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 12v4l3 3" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16" cy="24" r="1.5" fill="#34d399"/>
        </svg>
        CloudEnv API
        <span class="nav-pill">v1.1.0</span>
      </div>
      <div class="nav-links">
        <a href="/api/health">Health</a>
        <a href="https://github.com/BubbleIndexOne/Config-Manager-Backend" target="_blank">GitHub ↗</a>
      </div>
    </nav>

    <!-- ── Hero ───────────────────────────────────────────────── -->
    <section class="hero">
      <h1>Config Manager API</h1>
      <p>Multi-environment secret &amp; configuration management — powered by Cloudflare Workers + D1</p>
      <div class="hero-badges">
        <span class="badge badge-blue">Cloudflare Workers</span>
        <span class="badge badge-green">D1 Database</span>
        <span class="badge badge-orange">OpenAPI 3.1</span>
      </div>
    </section>

    <!-- ── Swagger UI ──────────────────────────────────────────── -->
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      const spec = {
        "openapi": "3.1.0",
        "info": {
          "title": "CloudEnv Multi-Environment Secret & Configuration Management API",
          "version": "1.1.0",
          "description": "Production-grade RESTful API for managing multi-tenant, multi-application environment variables, secret vaulting, Git sync automation, and cloud snapshot checkpoints.",
          "contact": { "name": "CloudEnv Platform Engineering", "email": "anshumansingh0802@gmail.com" },
          "license": { "name": "MIT" }
        },
        "servers": [
          { "url": window.location.origin, "description": "Current environment" },
          { "url": "http://localhost:8787", "description": "Local Wrangler dev server" },
          { "url": "https://ais-dev-laez5rdxokauwelolw5drk-862099746334.asia-east1.run.app", "description": "Cloud Run Preview" }
        ],
        "tags": [
          { "name": "System",          "description": "Service health check and diagnostic endpoints" },
          { "name": "Applications",    "description": "Core application mapping and metadata management" },
          { "name": "Environments",    "description": "Deployment environment isolation and configuration bounds" },
          { "name": "Variables",       "description": "Environment-specific variable and secret management" },
          { "name": "Cloud Snapshots", "description": "Full configuration backup checkpoints and restoration" },
          { "name": "Git Automation",  "description": "Bidirectional synchronization to GitHub / Bitbucket" }
        ],
        "security": [
          { "bearerAuth": [] }
        ],
        "paths": {
          "/api/health": {
            "get": { "summary": "Service Health Check", "tags": ["System"], "operationId": "getHealthStatus",
              "responses": { "200": { "description": "Service is healthy" } } }
          },
          "/api/apps": {
            "get": { "summary": "List Applications", "tags": ["Applications"], "operationId": "listApps",
              "responses": { "200": { "description": "List of all registered applications",
                "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/ProjectApp" } } } } } } },
            "post": { "summary": "Create Application", "tags": ["Applications"], "operationId": "createApp",
              "requestBody": { "required": true, "content": { "application/json": { "schema": {
                "type": "object", "required": ["name","slug"],
                "properties": { "name": {"type":"string"}, "slug": {"type":"string"}, "description": {"type":"string"}, "icon": {"type":"string"}, "color": {"type":"string"} }
              } } } },
              "responses": { "201": { "description": "Application successfully created",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ProjectApp" } } } } } }
          },
          "/api/environments": {
            "get": { "summary": "List Environments", "tags": ["Environments"], "operationId": "listEnvironments",
              "responses": { "200": { "description": "List of global environments",
                "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Environment" } } } } } } }
          },
          "/api/apps/{appId}/environments/{envId}/variables": {
            "get": { "summary": "List App Variables by Environment", "tags": ["Variables"], "operationId": "listVariables",
              "parameters": [
                { "name": "appId", "in": "path", "required": true, "schema": { "type": "string" } },
                { "name": "envId", "in": "path", "required": true, "schema": { "type": "string" } }
              ],
              "responses": { "200": { "description": "List of configuration variables",
                "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/ConfigVariable" } } } } } } },
            "post": { "summary": "Upsert Configuration Variable", "tags": ["Variables"], "operationId": "upsertVariable",
              "parameters": [
                { "name": "appId", "in": "path", "required": true, "schema": { "type": "string" } },
                { "name": "envId", "in": "path", "required": true, "schema": { "type": "string" } }
              ],
              "requestBody": { "required": true, "content": { "application/json": { "schema": {
                "type": "object", "required": ["key","value","isSecret","updatedBy"],
                "properties": { "key": {"type":"string"}, "value": {"type":"string"}, "isSecret": {"type":"boolean"},
                  "category": {"type":"string"}, "description": {"type":"string"},
                  "updatedBy": {"type":"string"}, "reason": {"type":"string"} }
              } } } },
              "responses": { "200": { "description": "Variable successfully created or updated",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ConfigVariable" } } } } } }
          },
          "/api/cloud/snapshot": {
            "post": { "summary": "Create Cloud Backup Snapshot", "tags": ["Cloud Snapshots"], "operationId": "createCloudSnapshot",
              "requestBody": { "required": true, "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateSnapshotRequest" } } } },
              "responses": { "200": { "description": "Snapshot persisted",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateSnapshotResponse" } } } } } }
          },
          "/api/cloud/snapshots": {
            "get": { "summary": "List Cloud Backup Snapshots", "tags": ["Cloud Snapshots"], "operationId": "listCloudSnapshots",
              "responses": { "200": { "description": "List of snapshots",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ListSnapshotsResponse" } } } } } }
          },
          "/api/cloud/restore": {
            "post": { "summary": "Restore Configuration from Snapshot", "tags": ["Cloud Snapshots"], "operationId": "restoreCloudSnapshot",
              "requestBody": { "required": true, "content": { "application/json": { "schema": {
                "type": "object", "required": ["snapshotId"],
                "properties": { "snapshotId": { "type": "string" } }
              } } } },
              "responses": { "200": { "description": "Snapshot successfully restored",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/RestoreSnapshotResponse" } } } } } }
          },
          "/api/git/sync": {
            "post": { "summary": "Execute Git Secret Sync", "tags": ["Git Automation"], "operationId": "syncGitSecrets",
              "requestBody": { "required": true, "content": { "application/json": { "schema": { "$ref": "#/components/schemas/GitSyncRequest" } } } },
              "responses": { "200": { "description": "Git sync execution succeeded",
                "content": { "application/json": { "schema": { "$ref": "#/components/schemas/GitSyncResponse" } } } } } }
          }
        },
        "components": {
          "securitySchemes": {
            "bearerAuth": {
              "type": "http",
              "scheme": "bearer",
              "bearerFormat": "API_KEY"
            }
          },
          "schemas": {
            "Environment": {
              "type": "object", "required": ["id","name","code","color"],
              "properties": {
                "id": {"type":"string"}, "name": {"type":"string"},
                "code": {"type":"string","enum":["development","preview","qa","staging","production"]},
                "color": {"type":"string"}, "description": {"type":"string"},
                "isLocked": {"type":"boolean","default":false},
                "cloudSyncEnabled": {"type":"boolean","default":true},
                "lastSyncedAt": {"type":"string","format":"date-time"}
              }
            },
            "ProjectApp": {
              "type": "object", "required": ["id","name","slug"],
              "properties": {
                "id": {"type":"string"}, "name": {"type":"string"}, "slug": {"type":"string"},
                "description": {"type":"string"}, "icon": {"type":"string"},
                "color": {"type":"string"}, "createdAt": {"type":"string","format":"date-time"}
              }
            },
            "VariableHistoryEntry": {
              "type": "object", "required": ["id","version","value","isSecret","timestamp","author","changeType"],
              "properties": {
                "id": {"type":"string"}, "version": {"type":"integer"}, "value": {"type":"string"},
                "isSecret": {"type":"boolean"}, "timestamp": {"type":"string","format":"date-time"},
                "author": {"type":"string"},
                "changeType": {"type":"string","enum":["create","update_value","toggle_secret","rollback","imported"]},
                "reason": {"type":"string"}, "previousValue": {"type":"string","nullable":true},
                "category": {"type":"string","nullable":true}
              }
            },
            "ConfigVariable": {
              "type": "object", "required": ["id","appId","key","value","isSecret","updatedAt","updatedBy","currentVersion","history"],
              "properties": {
                "id": {"type":"string"}, "appId": {"type":"string"}, "key": {"type":"string"},
                "value": {"type":"string"}, "isSecret": {"type":"boolean"},
                "category": {"type":"string"}, "description": {"type":"string"},
                "updatedAt": {"type":"string","format":"date-time"}, "updatedBy": {"type":"string"},
                "currentVersion": {"type":"integer"},
                "history": {"type":"array","items":{"$ref":"#/components/schemas/VariableHistoryEntry"}}
              }
            },
            "CreateSnapshotRequest": {
              "type": "object", "required": ["label","environments","variablesByEnv"],
              "properties": {
                "label": {"type":"string"}, "author": {"type":"string"},
                "environments": {"type":"array","items":{"$ref":"#/components/schemas/Environment"}},
                "apps": {"type":"array","items":{"$ref":"#/components/schemas/ProjectApp"}},
                "variablesByEnv": {"type":"object","additionalProperties":{"type":"array","items":{"$ref":"#/components/schemas/ConfigVariable"}}}
              }
            },
            "CreateSnapshotResponse": {
              "type": "object", "required": ["success","snapshot","totalSnapshots"],
              "properties": {
                "success": {"type":"boolean"},
                "snapshot": {"type":"object","properties":{
                  "id":{"type":"string"},"timestamp":{"type":"string","format":"date-time"},
                  "label":{"type":"string"},"environmentCount":{"type":"integer"},
                  "variableCount":{"type":"integer"},"author":{"type":"string"},"data":{"type":"object"}
                }},
                "totalSnapshots": {"type":"integer"}
              }
            },
            "ListSnapshotsResponse": {
              "type": "object", "required": ["success","snapshots"],
              "properties": {
                "success": {"type":"boolean"},
                "snapshots": {"type":"array","items":{"type":"object","properties":{
                  "id":{"type":"string"},"timestamp":{"type":"string","format":"date-time"},
                  "label":{"type":"string"},"environmentCount":{"type":"integer"},
                  "variableCount":{"type":"integer"},"author":{"type":"string"}
                }}}
              }
            },
            "RestoreSnapshotResponse": {
              "type": "object", "required": ["success","snapshot"],
              "properties": {
                "success": {"type":"boolean"},
                "snapshot": {"type":"object","properties":{
                  "id":{"type":"string"},"label":{"type":"string"},"data":{"type":"object"}
                }}
              }
            },
            "GitSyncRequest": {
              "type": "object", "required": ["provider","repoOwner","repoName","branch","action","variables"],
              "properties": {
                "provider": {"type":"string","enum":["github","bitbucket"]},
                "repoOwner": {"type":"string"}, "repoName": {"type":"string"}, "branch": {"type":"string"},
                "token": {"type":"string"}, "envCode": {"type":"string"}, "environment": {"type":"string"},
                "action": {"type":"string","enum":["push","pull"]},
                "syncTarget": {"type":"string","enum":["repo_secrets","env_file","deployment_env"]},
                "commitMessage": {"type":"string"},
                "variables": {"type":"array","items":{"$ref":"#/components/schemas/ConfigVariable"}}
              }
            },
            "GitSyncResponse": {
              "type": "object", "required": ["success","provider","repo","branch","commitSha","syncedCount","timestamp"],
              "properties": {
                "success": {"type":"boolean"}, "provider": {"type":"string"}, "repo": {"type":"string"},
                "branch": {"type":"string"}, "commitSha": {"type":"string"}, "commitMessage": {"type":"string"},
                "syncedCount": {"type":"integer"}, "syncTarget": {"type":"string"},
                "timestamp": {"type":"string","format":"date-time"}, "syncedFile": {"type":"string","nullable":true}
              }
            }
          }
        }
      };

      SwaggerUIBundle({
        spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        syntaxHighlight: { activate: true, theme: 'agate' },
      });
    </script>
  </body>
</html>`;

/**
 * GET /docs
 * Serves a dark-themed Swagger UI page with the full OpenAPI spec embedded inline.
 * No external spec file or CDN JSON fetch — works entirely within the Worker.
 */
export async function handleDocs(_req: Request, _env: Env): Promise<Response> {
	return new Response(SWAGGER_HTML, {
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "public, max-age=3600",
		},
	});
}
