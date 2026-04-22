import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import type { CompileResult, CompilerStageCode } from "@ada/compiler";

/**
 * Writes the Ada world model.
 *
 * Git-backed (when targetDir is a git repo):
 *   Each stage artifact → git blob object (SHA = content address)
 *   Manifest → git blob object
 *   All entries → git tree object
 *   .ada/ref = "ada/v1 <tree-sha>"   ← world model pointer (mirrors git HEAD pattern)
 *   .ada/manifest.json               ← fallback for MCP tools
 *
 * File-based fallback (non-git repos):
 *   .ada/artifacts/<postcode>/artifact.json
 *   .ada/manifest.json
 */

interface ManifestStageEntry {
  postcode: string;
  artifactPath?: string; // file-based
  sha?: string; // git-backed
}

interface Manifest {
  runId: string;
  compiledAt: number;
  intent: string;
  decision: string;
  stages: Partial<Record<CompilerStageCode, ManifestStageEntry>>;
  blueprintPostcode: string;
  governorPostcode: string;
}

function postcodeToDir(raw: string): string {
  return raw.replace(/\./g, "_").replace(/\//g, "_");
}

const STAGE_ARTIFACTS: Partial<
  Record<CompilerStageCode, (ps: CompileResult["pipelineState"]) => unknown>
> = {
  INT: (ps) => ps.intent,
  PER: (ps) => ps.persona,
  ENT: (ps) => ps.entity,
  PRO: (ps) => ps.process,
  SYN: (ps) => ps.synthesis,
  VER: (ps) => ps.verify,
  GOV: (ps) => ps.governor,
};

// ─── Git utilities ────────────────────────────────────────────────────────────

function isGitRepo(dir: string): boolean {
  try {
    const r = spawnSync("git", ["rev-parse", "--git-dir"], {
      cwd: dir,
      encoding: "utf8",
    });
    return r.status === 0;
  } catch {
    return false;
  }
}

function writeGitBlob(content: string, cwd: string): string {
  const r = spawnSync("git", ["hash-object", "-w", "--stdin"], {
    cwd,
    input: content,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`git hash-object: ${String(r.stderr)}`);
  return r.stdout.trim();
}

function writeGitTree(
  entries: { sha: string; name: string }[],
  cwd: string,
): string {
  const input = entries
    .map((e) => `100644 blob ${e.sha}\t${e.name}`)
    .join("\n");
  const r = spawnSync("git", ["mktree"], { cwd, input, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git mktree: ${String(r.stderr)}`);
  return r.stdout.trim();
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function writeWorldModel(
  result: CompileResult,
  runId: string,
  targetDir: string,
): void {
  const adaDir = path.join(targetDir, ".ada");
  fs.mkdirSync(adaDir, { recursive: true });

  const ps = result.pipelineState;
  const stages: Manifest["stages"] = {};

  if (isGitRepo(targetDir)) {
    // ── Git-backed path ──────────────────────────────────────────────────────
    // Artifacts become git blob objects. The tree SHA is the world model root.
    // .ada/ref = "ada/v1 <tree-sha>" — mirrors git's HEAD pointer pattern.

    const treeEntries: { sha: string; name: string }[] = [];

    for (const stageRecord of result.compilationRun.stages) {
      const code = stageRecord.stageCode as CompilerStageCode;
      const postcode = stageRecord.postcode.raw;
      const artifactFn = STAGE_ARTIFACTS[code];
      const artifactData = artifactFn ? artifactFn(ps) : null;
      const json = JSON.stringify(artifactData, null, 2);

      try {
        const sha = writeGitBlob(json, targetDir);
        stages[code] = { postcode, sha };
        treeEntries.push({ sha, name: code });
      } catch {
        // If git write fails for any stage, fall through to file-based below
        throw new Error(`git-backed write failed for stage ${code}`);
      }
    }

    const manifest: Manifest = {
      runId,
      compiledAt: result.compilationRun.completedAt,
      intent: result.compilationRun.sourceIntent.slice(0, 500),
      decision: result.governorDecision.decision,
      stages,
      blueprintPostcode: result.blueprint.postcode.raw,
      governorPostcode: result.governorDecision.postcode.raw,
    };

    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestSha = writeGitBlob(manifestJson, targetDir);
    treeEntries.push({ sha: manifestSha, name: "manifest" });

    const treeSha = writeGitTree(treeEntries, targetDir);

    // Write .ada/ref — the world model pointer
    fs.writeFileSync(path.join(adaDir, "ref"), `ada/v1 ${treeSha}\n`, "utf8");

    // Write manifest.json as fallback for MCP tools and human inspection
    fs.writeFileSync(path.join(adaDir, "manifest.json"), manifestJson, "utf8");
  } else {
    // ── File-based fallback (non-git repos) ─────────────────────────────────
    const artifactsDir = path.join(adaDir, "artifacts");
    fs.mkdirSync(artifactsDir, { recursive: true });

    for (const stageRecord of result.compilationRun.stages) {
      const code = stageRecord.stageCode as CompilerStageCode;
      const postcode = stageRecord.postcode.raw;
      const dirName = postcodeToDir(postcode);
      const artifactDir = path.join(artifactsDir, dirName);
      fs.mkdirSync(artifactDir, { recursive: true });

      const artifactFn = STAGE_ARTIFACTS[code];
      const artifactData = artifactFn ? artifactFn(ps) : null;

      fs.writeFileSync(
        path.join(artifactDir, "artifact.json"),
        JSON.stringify(artifactData, null, 2),
        "utf8",
      );

      const relPath = path.join(".ada", "artifacts", dirName, "artifact.json");
      stages[code] = { postcode, artifactPath: relPath };
    }

    const manifest: Manifest = {
      runId,
      compiledAt: result.compilationRun.completedAt,
      intent: result.compilationRun.sourceIntent.slice(0, 500),
      decision: result.governorDecision.decision,
      stages,
      blueprintPostcode: result.blueprint.postcode.raw,
      governorPostcode: result.governorDecision.postcode.raw,
    };

    fs.writeFileSync(
      path.join(adaDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
  }
}
