import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { AdaStorage } from "../src/index.js";

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeTempDbPath(): string {
  const name = `ada-storage-test-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.db`;
  return path.join(os.tmpdir(), name);
}

function cleanupDb(dbPath: string): void {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    const p = `${dbPath}${suffix}`;
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // best-effort cleanup
    }
  }
}

function makeRun(overrides: Partial<Parameters<AdaStorage["recordRun"]>[0]> = {}) {
  return {
    runId: `run-${Math.random().toString(36).slice(2, 10)}`,
    projectPath: "/tmp/example-project",
    compiledAt: Date.now(),
    decision: "ACCEPT",
    blueprintPostcode: "ML.SYN.abc123/v1",
    governorPostcode: "ML.GOV.def456/v1",
    intent: "build a thing",
    durationMs: 1234,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AdaStorage", () => {
  let dbPath: string;
  let storage: AdaStorage;

  beforeEach(() => {
    dbPath = makeTempDbPath();
    storage = new AdaStorage(dbPath);
  });

  afterEach(() => {
    cleanupDb(dbPath);
  });

  describe("construction", () => {
    it("constructs with an explicit dbPath and creates the file", () => {
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("creates parent directory if it does not exist", () => {
      const nestedDir = path.join(
        os.tmpdir(),
        `ada-storage-nested-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      const nestedPath = path.join(nestedDir, "sub", "storage.db");
      const nested = new AdaStorage(nestedPath);
      try {
        expect(fs.existsSync(nestedPath)).toBe(true);
      } finally {
        cleanupDb(nestedPath);
        try {
          fs.rmSync(nestedDir, { recursive: true, force: true });
        } catch {
          // best-effort
        }
        void nested;
      }
    });

    it("is idempotent across re-opens on the same dbPath", () => {
      storage.recordRun(makeRun({ projectPath: "/tmp/proj-a" }));
      const reopened = new AdaStorage(dbPath);
      const projects = reopened.listProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].projectPath).toBe("/tmp/proj-a");
    });
  });

  describe("recordRun()", () => {
    it("creates a project record on first call", () => {
      const run = makeRun({
        projectPath: "/tmp/proj-first",
        runId: "run-first",
        compiledAt: 1000,
        decision: "ACCEPT",
        blueprintPostcode: "ML.SYN.first/v1",
      });
      storage.recordRun(run);

      const project = storage.getProject("/tmp/proj-first");
      expect(project).toBeDefined();
      expect(project?.projectPath).toBe("/tmp/proj-first");
      expect(project?.runCount).toBe(1);
      expect(project?.firstCompiledAt).toBe(1000);
      expect(project?.lastCompiledAt).toBe(1000);
      expect(project?.lastDecision).toBe("ACCEPT");
      expect(project?.lastRunId).toBe("run-first");
      expect(project?.lastBlueprintPostcode).toBe("ML.SYN.first/v1");
    });

    it("increments runCount on subsequent calls for the same projectPath", () => {
      const projectPath = "/tmp/proj-repeat";
      storage.recordRun(
        makeRun({ projectPath, runId: "run-1", compiledAt: 1000 }),
      );
      storage.recordRun(
        makeRun({ projectPath, runId: "run-2", compiledAt: 2000 }),
      );
      storage.recordRun(
        makeRun({ projectPath, runId: "run-3", compiledAt: 3000 }),
      );

      const project = storage.getProject(projectPath);
      expect(project?.runCount).toBe(3);
      expect(project?.firstCompiledAt).toBe(1000);
      expect(project?.lastCompiledAt).toBe(3000);
      expect(project?.lastRunId).toBe("run-3");
    });

    it("updates last* fields to the most recent run", () => {
      const projectPath = "/tmp/proj-last-fields";
      storage.recordRun(
        makeRun({
          projectPath,
          runId: "run-old",
          compiledAt: 100,
          decision: "ITERATE",
          blueprintPostcode: "ML.SYN.old/v1",
        }),
      );
      storage.recordRun(
        makeRun({
          projectPath,
          runId: "run-new",
          compiledAt: 500,
          decision: "ACCEPT",
          blueprintPostcode: "ML.SYN.new/v2",
        }),
      );

      const project = storage.getProject(projectPath);
      expect(project?.lastDecision).toBe("ACCEPT");
      expect(project?.lastRunId).toBe("run-new");
      expect(project?.lastBlueprintPostcode).toBe("ML.SYN.new/v2");
      expect(project?.firstCompiledAt).toBe(100);
    });

    it("tracks projects independently by projectPath", () => {
      storage.recordRun(
        makeRun({ projectPath: "/tmp/a", runId: "a1", compiledAt: 1 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/a", runId: "a2", compiledAt: 2 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/b", runId: "b1", compiledAt: 3 }),
      );

      expect(storage.getProject("/tmp/a")?.runCount).toBe(2);
      expect(storage.getProject("/tmp/b")?.runCount).toBe(1);
    });

    it("truncates intent to 500 chars when storing run", () => {
      const longIntent = "x".repeat(1000);
      const run = makeRun({
        projectPath: "/tmp/proj-long",
        runId: "run-long",
        intent: longIntent,
      });
      storage.recordRun(run);

      const history = storage.getRunHistory("/tmp/proj-long");
      expect(history).toHaveLength(1);
      expect(history[0].intent.length).toBe(500);
    });
  });

  describe("listProjects()", () => {
    it("returns an empty array when no projects exist", () => {
      expect(storage.listProjects()).toEqual([]);
    });

    it("returns projects sorted by lastCompiledAt descending", () => {
      storage.recordRun(
        makeRun({ projectPath: "/tmp/oldest", runId: "o1", compiledAt: 100 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/newest", runId: "n1", compiledAt: 9000 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/middle", runId: "m1", compiledAt: 500 }),
      );

      const projects = storage.listProjects();
      expect(projects.map((p) => p.projectPath)).toEqual([
        "/tmp/newest",
        "/tmp/middle",
        "/tmp/oldest",
      ]);
    });

    it("reflects lastCompiledAt after an update rewrites the ordering", () => {
      storage.recordRun(
        makeRun({ projectPath: "/tmp/a", runId: "a1", compiledAt: 100 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/b", runId: "b1", compiledAt: 200 }),
      );
      // /tmp/a now becomes the most recent
      storage.recordRun(
        makeRun({ projectPath: "/tmp/a", runId: "a2", compiledAt: 300 }),
      );

      const projects = storage.listProjects();
      expect(projects.map((p) => p.projectPath)).toEqual(["/tmp/a", "/tmp/b"]);
    });
  });

  describe("getProject()", () => {
    it("returns undefined for unknown projectPath", () => {
      expect(storage.getProject("/tmp/nope")).toBeUndefined();
    });

    it("returns the project record for a known projectPath", () => {
      storage.recordRun(
        makeRun({ projectPath: "/tmp/known", runId: "k1", compiledAt: 42 }),
      );
      const project = storage.getProject("/tmp/known");
      expect(project?.projectPath).toBe("/tmp/known");
      expect(project?.runCount).toBe(1);
    });
  });

  describe("getRunHistory()", () => {
    it("returns an empty array when the project has no runs", () => {
      expect(storage.getRunHistory("/tmp/missing")).toEqual([]);
    });

    it("returns runs for a project sorted by compiledAt descending", () => {
      const projectPath = "/tmp/history";
      storage.recordRun(
        makeRun({ projectPath, runId: "r-100", compiledAt: 100 }),
      );
      storage.recordRun(
        makeRun({ projectPath, runId: "r-300", compiledAt: 300 }),
      );
      storage.recordRun(
        makeRun({ projectPath, runId: "r-200", compiledAt: 200 }),
      );

      const history = storage.getRunHistory(projectPath);
      expect(history.map((r) => r.runId)).toEqual(["r-300", "r-200", "r-100"]);
    });

    it("filters runs by projectPath", () => {
      storage.recordRun(
        makeRun({ projectPath: "/tmp/p1", runId: "r-p1", compiledAt: 1 }),
      );
      storage.recordRun(
        makeRun({ projectPath: "/tmp/p2", runId: "r-p2", compiledAt: 2 }),
      );

      const h1 = storage.getRunHistory("/tmp/p1");
      expect(h1).toHaveLength(1);
      expect(h1[0].runId).toBe("r-p1");

      const h2 = storage.getRunHistory("/tmp/p2");
      expect(h2).toHaveLength(1);
      expect(h2[0].runId).toBe("r-p2");
    });

    it("honours the limit argument", () => {
      const projectPath = "/tmp/limit";
      for (let i = 0; i < 5; i++) {
        storage.recordRun(
          makeRun({
            projectPath,
            runId: `r-${i}`,
            compiledAt: 100 + i,
          }),
        );
      }

      const limited = storage.getRunHistory(projectPath, 2);
      expect(limited).toHaveLength(2);
      expect(limited.map((r) => r.runId)).toEqual(["r-4", "r-3"]);
    });

    it("defaults limit to 20 when unspecified", () => {
      const projectPath = "/tmp/default-limit";
      for (let i = 0; i < 25; i++) {
        storage.recordRun(
          makeRun({
            projectPath,
            runId: `r-${i}`,
            compiledAt: 1000 + i,
          }),
        );
      }

      const history = storage.getRunHistory(projectPath);
      expect(history).toHaveLength(20);
    });

    it("preserves all run fields in the returned records", () => {
      const projectPath = "/tmp/fields";
      storage.recordRun(
        makeRun({
          projectPath,
          runId: "r-fields",
          compiledAt: 777,
          decision: "ITERATE",
          blueprintPostcode: "ML.SYN.bp/v1",
          governorPostcode: "ML.GOV.gv/v1",
          intent: "short intent",
          durationMs: 4242,
        }),
      );

      const [record] = storage.getRunHistory(projectPath);
      expect(record.runId).toBe("r-fields");
      expect(record.projectPath).toBe(projectPath);
      expect(record.compiledAt).toBe(777);
      expect(record.decision).toBe("ITERATE");
      expect(record.blueprintPostcode).toBe("ML.SYN.bp/v1");
      expect(record.governorPostcode).toBe("ML.GOV.gv/v1");
      expect(record.intent).toBe("short intent");
      expect(record.durationMs).toBe(4242);
    });
  });
});
