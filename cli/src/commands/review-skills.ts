import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Types (duplicated from mcp-server to avoid cross-package dep) ────────────

interface SkillCandidate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  frequency: number;
  sessionIds: string[];
  observedPaths: string[];
  suggestedSkillBody: string;
  status: "pending" | "approved" | "rejected";
  proposedAt: number;
  reviewedAt: number | null;
}

interface SkillProposal {
  id: string;
  name: string;
  description: string;
  trigger: string;
  skillBody: string;
  proposedBy: "extraction" | "human";
  rationale: string;
  status: "pending" | "approved" | "rejected";
  proposedAt: number;
  reviewedAt: number | null;
}

// ─── Skill history record (for rollback) ─────────────────────────────────────

interface SkillHistoryRecord {
  id: string;
  name: string;
  slug: string;
  skillPath: string;
  promotedAt: number;
  rolledBackAt: number | null;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

function getProjectDir(): string {
  return (
    process.env["ADA_PROJECT_DIR"] ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd()
  );
}

function candidatesPath(d: string): string {
  return path.join(d, ".ada", "skill-candidates.json");
}

function proposalsPath(d: string): string {
  return path.join(d, ".ada", "skill-proposals.json");
}

function skillHistoryPath(d: string): string {
  return path.join(d, ".ada", "skill-history.json");
}

// ─── I/O helpers ─────────────────────────────────────────────────────────────

function loadJson<T>(p: string): T[] {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T[];
  } catch {
    return [];
  }
}

function saveJson(p: string, data: unknown): void {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ─── Skill promotion ──────────────────────────────────────────────────────────

function promoteSkill(
  item: SkillCandidate | SkillProposal,
  projectDir: string,
): string {
  const body = "skillBody" in item ? item.skillBody : item.suggestedSkillBody;
  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const skillDir = path.join(projectDir, ".claude", "skills", slug);
  fs.mkdirSync(skillDir, { recursive: true });
  const skillPath = path.join(skillDir, "SKILL.md");
  fs.writeFileSync(skillPath, body, "utf8");

  // Record in skill history for rollback support
  const histPath = skillHistoryPath(projectDir);
  const history = loadJson<SkillHistoryRecord>(histPath);
  const record: SkillHistoryRecord = {
    id: item.id,
    name: item.name,
    slug,
    skillPath,
    promotedAt: Date.now(),
    rolledBackAt: null,
  };
  saveJson(histPath, [...history, record]);

  return skillPath;
}

// ─── Command ──────────────────────────────────────────────────────────────────

export async function reviewSkillsCommand(): Promise<void> {
  const projectDir = getProjectDir();

  const candidates = loadJson<SkillCandidate>(
    candidatesPath(projectDir),
  ).filter((c) => c.status === "pending");
  const proposals = loadJson<SkillProposal>(proposalsPath(projectDir)).filter(
    (p) => p.status === "pending",
  );

  type Reviewable =
    | (SkillCandidate & { _source: "candidate" })
    | (SkillProposal & { _source: "proposal" });

  const queue: Reviewable[] = [
    ...candidates.map((c) => ({ ...c, _source: "candidate" as const })),
    ...proposals.map((p) => ({ ...p, _source: "proposal" as const })),
  ];

  if (queue.length === 0) {
    console.log("");
    console.log("  No pending skill candidates or proposals.");
    console.log("  Run `ada extract-skills` to analyze session patterns.");
    console.log("");
    return;
  }

  console.log("");
  console.log(`  ◈ ada review-skills — ${queue.length} pending`);
  console.log(
    "  Governance rule: skills improve workflows. They do not modify",
  );
  console.log("  compiled intent, entity invariants, or delegation policies.");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let approved = 0;
  let rejected = 0;

  for (const item of queue) {
    const source = item._source === "proposal" ? "PROPOSED" : "EXTRACTED";
    const body =
      item._source === "proposal" ? item.skillBody : item.suggestedSkillBody;

    console.log(`  ┌─ [${source}] ${item.name}`);
    console.log(`  │  ${item.description}`);
    if (item._source === "candidate") {
      console.log(`  │  Seen in ${item.frequency} session(s)`);
    }
    if (item._source === "proposal" && item.rationale) {
      console.log(`  │  Rationale: ${item.rationale}`);
    }
    console.log(`  │  Trigger: ${item.trigger}`);
    console.log("  │");
    console.log("  │  Proposed SKILL.md:");
    const bodyLines = body.split("\n");
    for (const line of bodyLines.slice(0, 12)) {
      console.log(`  │    ${line}`);
    }
    if (bodyLines.length > 12) {
      console.log(`  │    ... (${bodyLines.length - 12} more lines)`);
    }
    console.log("  └─");
    console.log("");

    const answer = await ask(rl, "  Approve (a), Reject (r), or Skip (s)? ");
    const choice = answer.trim().toLowerCase();

    const now = Date.now();

    if (choice === "a" || choice === "approve") {
      const skillPath = promoteSkill(item, projectDir);
      console.log(`  ✓ Promoted → ${skillPath}`);

      if (item._source === "candidate") {
        const all = loadJson<SkillCandidate>(candidatesPath(projectDir));
        saveJson(
          candidatesPath(projectDir),
          all.map((c) =>
            c.id === item.id
              ? { ...c, status: "approved", reviewedAt: now }
              : c,
          ),
        );
      } else {
        const all = loadJson<SkillProposal>(proposalsPath(projectDir));
        saveJson(
          proposalsPath(projectDir),
          all.map((p) =>
            p.id === item.id
              ? { ...p, status: "approved", reviewedAt: now }
              : p,
          ),
        );
      }
      approved++;
    } else if (choice === "r" || choice === "reject") {
      if (item._source === "candidate") {
        const all = loadJson<SkillCandidate>(candidatesPath(projectDir));
        saveJson(
          candidatesPath(projectDir),
          all.map((c) =>
            c.id === item.id
              ? { ...c, status: "rejected", reviewedAt: now }
              : c,
          ),
        );
      } else {
        const all = loadJson<SkillProposal>(proposalsPath(projectDir));
        saveJson(
          proposalsPath(projectDir),
          all.map((p) =>
            p.id === item.id
              ? { ...p, status: "rejected", reviewedAt: now }
              : p,
          ),
        );
      }
      console.log("  ✗ Rejected.");
      rejected++;
    } else {
      console.log("  — Skipped.");
    }
    console.log("");
  }

  rl.close();

  console.log(`  Review complete: ${approved} approved, ${rejected} rejected.`);
  if (approved > 0) {
    console.log(
      "  Skills written to .claude/skills/ — available in next Claude Code session.",
    );
    console.log("  To undo any skill: ada rollback-skill <name>");
  }
  console.log("");
}

// ─── Rollback command ─────────────────────────────────────────────────────────

export function rollbackSkillCommand(nameArg: string): void {
  const projectDir = getProjectDir();
  const histPath = skillHistoryPath(projectDir);
  const history = loadJson<SkillHistoryRecord>(histPath);

  // Match by name (case-insensitive) or slug
  const target = history.find(
    (r) =>
      r.rolledBackAt === null &&
      (r.name.toLowerCase() === nameArg.toLowerCase() ||
        r.slug === nameArg.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  );

  if (!target) {
    const activeNames = history
      .filter((r) => r.rolledBackAt === null)
      .map((r) => r.name);

    if (activeNames.length === 0) {
      console.error("  No promoted skills to roll back.");
    } else {
      console.error(`  No skill matching "${nameArg}" found.`);
      console.error(`  Active skills: ${activeNames.join(", ")}`);
    }
    process.exit(1);
  }

  // Remove the skill file
  if (fs.existsSync(target.skillPath)) {
    fs.unlinkSync(target.skillPath);
    // Remove empty skill dir if present
    const skillDir = path.dirname(target.skillPath);
    try {
      const remaining = fs.readdirSync(skillDir);
      if (remaining.length === 0) fs.rmdirSync(skillDir);
    } catch {
      // Dir not empty or already gone — fine
    }
    console.log(`  ✓ Removed ${target.skillPath}`);
  } else {
    console.log(
      `  Skill file not found at ${target.skillPath} — clearing record anyway.`,
    );
  }

  // Mark rolled back in history
  saveJson(
    histPath,
    history.map((r) =>
      r.id === target.id ? { ...r, rolledBackAt: Date.now() } : r,
    ),
  );

  console.log(`  ✓ Rolled back skill: ${target.name}`);
  console.log("  Changes take effect in next Claude Code session.");
  console.log("");
}
