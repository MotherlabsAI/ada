import Database from "better-sqlite3";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectRecord {
  readonly projectPath: string;
  readonly firstCompiledAt: number;
  readonly lastCompiledAt: number;
  readonly runCount: number;
  readonly lastDecision: string;
  readonly lastRunId: string;
  readonly lastBlueprintPostcode: string;
}

export interface RunRecord {
  readonly runId: string;
  readonly projectPath: string;
  readonly compiledAt: number;
  readonly decision: string;
  readonly blueprintPostcode: string;
  readonly governorPostcode: string;
  readonly intent: string;
  readonly durationMs: number;
}

export interface LedgerRecord {
  readonly intentHash: string;
  readonly blueprintPostcode: string;
  readonly gateDeltas: string; // JSON-serialized GateDelta[]
  readonly entropyReadings: string; // JSON-serialized Record<string, number>
  readonly timestamp: number;
  readonly runId: string;
  readonly decision: string;
  readonly postcodeRaw: string;
  readonly projectPath: string;
}

// ─── AdaStorage ──────────────────────────────────────────────────────────────

/**
 * Global project registry and run history for Ada.
 *
 * Stored at ~/.ada/storage.db — one database across all projects.
 * Indexed by project directory path.
 */
export class AdaStorage {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.join(os.homedir(), ".ada", "storage.db");
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this._migrate();
  }

  private _migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        project_path TEXT PRIMARY KEY,
        first_compiled_at INTEGER NOT NULL,
        last_compiled_at INTEGER NOT NULL,
        run_count INTEGER NOT NULL DEFAULT 0,
        last_decision TEXT NOT NULL,
        last_run_id TEXT NOT NULL,
        last_blueprint_postcode TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        compiled_at INTEGER NOT NULL,
        decision TEXT NOT NULL,
        blueprint_postcode TEXT NOT NULL DEFAULT '',
        governor_postcode TEXT NOT NULL DEFAULT '',
        intent TEXT NOT NULL DEFAULT '',
        duration_ms INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS runs_by_project ON runs (project_path, compiled_at DESC);

      CREATE TABLE IF NOT EXISTS compile_ledger (
        run_id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        intent_hash TEXT NOT NULL,
        blueprint_postcode TEXT NOT NULL,
        gate_deltas TEXT NOT NULL DEFAULT '[]',
        entropy_readings TEXT NOT NULL DEFAULT '{}',
        timestamp INTEGER NOT NULL,
        decision TEXT NOT NULL,
        postcode_raw TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS ledger_by_project ON compile_ledger (project_path, timestamp DESC);
      CREATE INDEX IF NOT EXISTS ledger_by_intent ON compile_ledger (intent_hash, timestamp DESC);
    `);
  }

  /** Register a compilation run for a project. Creates project record if first run. */
  recordRun(run: {
    runId: string;
    projectPath: string;
    compiledAt: number;
    decision: string;
    blueprintPostcode: string;
    governorPostcode: string;
    intent: string;
    durationMs: number;
  }): void {
    // Upsert run record
    this.db
      .prepare(
        `INSERT OR REPLACE INTO runs
        (run_id, project_path, compiled_at, decision, blueprint_postcode, governor_postcode, intent, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        run.runId,
        run.projectPath,
        run.compiledAt,
        run.decision,
        run.blueprintPostcode,
        run.governorPostcode,
        run.intent.slice(0, 500),
        run.durationMs,
      );

    // Upsert project record
    const existing = this.db
      .prepare("SELECT * FROM projects WHERE project_path = ?")
      .get(run.projectPath) as
      | { first_compiled_at: number; run_count: number }
      | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE projects SET
          last_compiled_at = ?,
          run_count = ?,
          last_decision = ?,
          last_run_id = ?,
          last_blueprint_postcode = ?
          WHERE project_path = ?`,
        )
        .run(
          run.compiledAt,
          existing.run_count + 1,
          run.decision,
          run.runId,
          run.blueprintPostcode,
          run.projectPath,
        );
    } else {
      this.db
        .prepare(
          `INSERT INTO projects
          (project_path, first_compiled_at, last_compiled_at, run_count, last_decision, last_run_id, last_blueprint_postcode)
          VALUES (?, ?, ?, 1, ?, ?, ?)`,
        )
        .run(
          run.projectPath,
          run.compiledAt,
          run.compiledAt,
          run.decision,
          run.runId,
          run.blueprintPostcode,
        );
    }
  }

  /** Get all projects, most recently compiled first. */
  listProjects(): ProjectRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM projects ORDER BY last_compiled_at DESC")
      .all() as Array<{
      project_path: string;
      first_compiled_at: number;
      last_compiled_at: number;
      run_count: number;
      last_decision: string;
      last_run_id: string;
      last_blueprint_postcode: string;
    }>;

    return rows.map((r) => ({
      projectPath: r.project_path,
      firstCompiledAt: r.first_compiled_at,
      lastCompiledAt: r.last_compiled_at,
      runCount: r.run_count,
      lastDecision: r.last_decision,
      lastRunId: r.last_run_id,
      lastBlueprintPostcode: r.last_blueprint_postcode,
    }));
  }

  /** Get a specific project by path. */
  getProject(projectPath: string): ProjectRecord | undefined {
    const row = this.db
      .prepare("SELECT * FROM projects WHERE project_path = ?")
      .get(projectPath) as
      | {
          project_path: string;
          first_compiled_at: number;
          last_compiled_at: number;
          run_count: number;
          last_decision: string;
          last_run_id: string;
          last_blueprint_postcode: string;
        }
      | undefined;

    if (!row) return undefined;
    return {
      projectPath: row.project_path,
      firstCompiledAt: row.first_compiled_at,
      lastCompiledAt: row.last_compiled_at,
      runCount: row.run_count,
      lastDecision: row.last_decision,
      lastRunId: row.last_run_id,
      lastBlueprintPostcode: row.last_blueprint_postcode,
    };
  }

  /** Get run history for a project, most recent first. */
  getRunHistory(projectPath: string, limit = 20): RunRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM runs WHERE project_path = ? ORDER BY compiled_at DESC LIMIT ?",
      )
      .all(projectPath, limit) as Array<{
      run_id: string;
      project_path: string;
      compiled_at: number;
      decision: string;
      blueprint_postcode: string;
      governor_postcode: string;
      intent: string;
      duration_ms: number;
    }>;

    return rows.map((r) => ({
      runId: r.run_id,
      projectPath: r.project_path,
      compiledAt: r.compiled_at,
      decision: r.decision,
      blueprintPostcode: r.blueprint_postcode,
      governorPostcode: r.governor_postcode,
      intent: r.intent,
      durationMs: r.duration_ms,
    }));
  }

  // ─── Accumulation Ledger ────────────────────────────────────────────────────

  /** Write a CompileRecord to the accumulation ledger. Called on Governor ACCEPT. */
  recordCompile(record: {
    runId: string;
    projectPath: string;
    intentHash: string;
    blueprintPostcode: string;
    gateDeltas: string;
    entropyReadings: string;
    timestamp: number;
    decision: string;
    postcodeRaw: string;
  }): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO compile_ledger
        (run_id, project_path, intent_hash, blueprint_postcode, gate_deltas, entropy_readings, timestamp, decision, postcode_raw)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.runId,
        record.projectPath,
        record.intentHash,
        record.blueprintPostcode,
        record.gateDeltas,
        record.entropyReadings,
        record.timestamp,
        record.decision,
        record.postcodeRaw,
      );
  }

  /** Read recent ledger entries for a project, most recent first. */
  getRecentCompileRecords(projectPath: string, limit = 5): LedgerRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM compile_ledger WHERE project_path = ? ORDER BY timestamp DESC LIMIT ?",
      )
      .all(projectPath, limit) as Array<{
      run_id: string;
      project_path: string;
      intent_hash: string;
      blueprint_postcode: string;
      gate_deltas: string;
      entropy_readings: string;
      timestamp: number;
      decision: string;
      postcode_raw: string;
    }>;

    return rows.map((r) => ({
      runId: r.run_id,
      projectPath: r.project_path,
      intentHash: r.intent_hash,
      blueprintPostcode: r.blueprint_postcode,
      gateDeltas: r.gate_deltas,
      entropyReadings: r.entropy_readings,
      timestamp: r.timestamp,
      decision: r.decision,
      postcodeRaw: r.postcode_raw,
    }));
  }

  /** Read ledger entries across all projects matching an intent hash. */
  getRecordsByIntentHash(intentHash: string, limit = 3): LedgerRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM compile_ledger WHERE intent_hash = ? ORDER BY timestamp DESC LIMIT ?",
      )
      .all(intentHash, limit) as Array<{
      run_id: string;
      project_path: string;
      intent_hash: string;
      blueprint_postcode: string;
      gate_deltas: string;
      entropy_readings: string;
      timestamp: number;
      decision: string;
      postcode_raw: string;
    }>;

    return rows.map((r) => ({
      runId: r.run_id,
      projectPath: r.project_path,
      intentHash: r.intent_hash,
      blueprintPostcode: r.blueprint_postcode,
      gateDeltas: r.gate_deltas,
      entropyReadings: r.entropy_readings,
      timestamp: r.timestamp,
      decision: r.decision,
      postcodeRaw: r.postcode_raw,
    }));
  }
}
