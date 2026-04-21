import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkillCandidate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: string;
  readonly frequency: number; // how many runs showed this pattern
  readonly sessionIds: readonly string[];
  readonly observedPaths: readonly string[];
  readonly suggestedSkillBody: string;
  readonly status: "pending" | "approved" | "rejected";
  readonly proposedAt: number;
  readonly reviewedAt: number | null;
}

export interface SkillProposal {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: string;
  readonly skillBody: string; // full markdown body for SKILL.md
  readonly proposedBy: "extraction" | "human";
  readonly rationale: string;
  readonly status: "pending" | "approved" | "rejected";
  readonly proposedAt: number;
  readonly reviewedAt: number | null;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

function getProjectDir(): string {
  return (
    process.env["ADA_PROJECT_DIR"] ??
    (process.env["ADA_STATE_PATH"]
      ? path.dirname(process.env["ADA_STATE_PATH"]!)
      : null) ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd()
  );
}

function skillProposalsPath(projectDir: string): string {
  return path.join(projectDir, ".ada", "skill-proposals.json");
}

function skillCandidatesPath(projectDir: string): string {
  return path.join(projectDir, ".ada", "skill-candidates.json");
}

// ─── Governor-lesson extractor ────────────────────────────────────────────────

interface GovRecord {
  runDir: string;
  decision: string;
  violations: Array<{
    stageCode: string;
    ruleViolated: string;
    description: string;
    severity: string;
  }>;
  nextAction: string | null;
}

function extractGovernorLessons(projectDir: string): SkillCandidate[] {
  const runsDir = path.join(projectDir, ".ada", "runs");
  let runDirs: string[] = [];
  try {
    runDirs = fs
      .readdirSync(runsDir)
      .map((d) => path.join(runsDir, d))
      .filter((d) => {
        try {
          return fs.statSync(d).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }

  const govRecords: GovRecord[] = [];
  for (const runDir of runDirs) {
    const govPath = path.join(runDir, "GOV.json");
    try {
      const gov = JSON.parse(fs.readFileSync(govPath, "utf8")) as {
        decision?: string;
        violations?: Array<{
          stageCode: string;
          ruleViolated: string;
          description: string;
          severity: string;
        }>;
        nextAction?: string | null;
      };
      govRecords.push({
        runDir,
        decision: gov.decision ?? "UNKNOWN",
        violations: gov.violations ?? [],
        nextAction: gov.nextAction ?? null,
      });
    } catch {
      /* skip missing or corrupt GOV artifacts */
    }
  }

  if (govRecords.length < 2) return [];

  // Group violation types across runs — only ITERATE/REJECT runs carry lessons
  const violationGroups = new Map<
    string,
    Array<{ runDir: string; description: string; nextAction: string | null }>
  >();
  for (const rec of govRecords) {
    if (rec.decision !== "ITERATE" && rec.decision !== "REJECT") continue;
    for (const v of rec.violations) {
      const key = `${v.stageCode}:${v.ruleViolated}`;
      const existing = violationGroups.get(key) ?? [];
      existing.push({
        runDir: rec.runDir,
        description: v.description,
        nextAction: rec.nextAction,
      });
      violationGroups.set(key, existing);
    }
  }

  const candidates: SkillCandidate[] = [];
  for (const [key, instances] of violationGroups) {
    if (instances.length < 2) continue;

    const colonIdx = key.indexOf(":");
    const stageCode = key.slice(0, colonIdx);
    const ruleViolated = key.slice(colonIdx + 1);
    const slug = `fix-${key
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .slice(0, 50)}`;
    const id = `sk-gov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const latestNextAction =
      instances[instances.length - 1]?.nextAction ?? null;
    const trigger = `${stageCode} violation: ${ruleViolated}`;

    const suggestedSkillBody = [
      "---",
      `name: ${slug}`,
      `description: "Use when ${stageCode} fails with '${ruleViolated}' (extracted from governor ITERATE history)."`,
      "---",
      "",
      `# ${slug}`,
      "",
      `Trigger: ${trigger}`,
      "",
      "## Context",
      `Detected in ${instances.length} compilation runs as a recurring governor violation.`,
      ...(latestNextAction
        ? [`Last governor correction: ${latestNextAction}`]
        : []),
      "",
      "## Steps",
      "1. **diagnose-violation**",
      `   - Pre: violation "${ruleViolated}" present in ${stageCode} stage`,
      `   - Action: review the ${stageCode} stage output and identify root cause`,
      `   - Post: root cause understood`,
      "",
      "2. **apply-correction**",
      latestNextAction
        ? `   - Action: ${latestNextAction.slice(0, 400)}`
        : `   - Action: apply targeted fix to ${stageCode} stage output`,
      `   - Post: violation resolved; coverage/coherence scores improve`,
      "",
      "## Observed in runs",
      ...instances.map(
        (i) => `- ${path.basename(i.runDir)}: ${i.description.slice(0, 100)}`,
      ),
      "",
      "## Human review notes",
      "<!-- Add notes here before approving -->",
    ].join("\n");

    candidates.push({
      id,
      name: slug,
      description: `Governor violation "${ruleViolated}" at ${stageCode} — ${instances.length} occurrences`,
      trigger,
      frequency: instances.length,
      sessionIds: instances.map((i) => path.basename(i.runDir)),
      observedPaths: [],
      suggestedSkillBody,
      status: "pending",
      proposedAt: Date.now(),
      reviewedAt: null,
    });
  }

  return candidates;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadCandidates(projectDir: string): SkillCandidate[] {
  try {
    const raw = fs.readFileSync(skillCandidatesPath(projectDir), "utf8");
    return JSON.parse(raw) as SkillCandidate[];
  } catch {
    return [];
  }
}

function saveCandidates(
  projectDir: string,
  candidates: SkillCandidate[],
): void {
  fs.mkdirSync(path.join(projectDir, ".ada"), { recursive: true });
  fs.writeFileSync(
    skillCandidatesPath(projectDir),
    JSON.stringify(candidates, null, 2),
    "utf8",
  );
}

export function loadProposals(projectDir: string): SkillProposal[] {
  try {
    const raw = fs.readFileSync(skillProposalsPath(projectDir), "utf8");
    return JSON.parse(raw) as SkillProposal[];
  } catch {
    return [];
  }
}

function saveProposals(projectDir: string, proposals: SkillProposal[]): void {
  fs.mkdirSync(path.join(projectDir, ".ada"), { recursive: true });
  fs.writeFileSync(
    skillProposalsPath(projectDir),
    JSON.stringify(proposals, null, 2),
    "utf8",
  );
}

// ─── MCP tool: ada.extract_skills ────────────────────────────────────────────

export function extractSkills(): { content: string; isError: boolean } {
  const projectDir = getProjectDir();
  const lessons = extractGovernorLessons(projectDir);

  if (lessons.length === 0) {
    return {
      content:
        "No governor lesson patterns found yet.\n" +
        "Governor-lesson candidates require 2+ compilation runs with the same violation type (ITERATE/REJECT).\n" +
        "Continue compiling and re-run after more runs accumulate.",
      isError: false,
    };
  }

  const existing = loadCandidates(projectDir);
  const existingTriggers = new Set(existing.map((c) => c.trigger));
  const newCandidates = lessons.filter((c) => !existingTriggers.has(c.trigger));
  const allCandidates = [...existing, ...newCandidates];
  saveCandidates(projectDir, allCandidates);

  const lines = [
    `Skill extraction complete (governor-lesson mode).`,
    `New candidates: ${newCandidates.length}`,
    `Total candidates: ${allCandidates.length}`,
    "",
  ];

  if (newCandidates.length > 0) {
    lines.push("New skill candidates (from governor ITERATE patterns):");
    for (const c of newCandidates) {
      lines.push(`  [${c.id}] ${c.name}`);
      lines.push(`    Trigger: ${c.trigger}`);
      lines.push(`    Seen in ${c.frequency} runs`);
    }
    lines.push("");
    lines.push("Review with: ada review-skills");
  } else {
    lines.push(
      "No new patterns — all detected violations are already candidates.",
    );
  }

  return { content: lines.join("\n"), isError: false };
}

// ─── MCP tool: ada.propose_skill ─────────────────────────────────────────────

export function proposeSkill(
  name: string,
  description: string,
  trigger: string,
  skillBody: string,
  rationale: string,
): { content: string; isError: boolean } {
  const projectDir = getProjectDir();
  const proposals = loadProposals(projectDir);

  const proposal: SkillProposal = {
    id: `sp-${Date.now()}`,
    name,
    description,
    trigger,
    skillBody,
    proposedBy: "human",
    rationale,
    status: "pending",
    proposedAt: Date.now(),
    reviewedAt: null,
  };

  proposals.push(proposal);
  saveProposals(projectDir, proposals);

  return {
    content:
      `Skill proposal queued: ${proposal.id}\n` +
      `Name: ${name}\n` +
      `Trigger: ${trigger}\n` +
      `Rationale: ${rationale}\n\n` +
      `Review with: ada review-skills\n` +
      `Approved skills are written to .claude/skills/${name}/SKILL.md`,
    isError: false,
  };
}

// ─── Skill promotion (called from CLI after human approval) ───────────────────

export function promoteSkill(
  proposal: SkillProposal | SkillCandidate,
  projectDir: string,
): string {
  const body =
    "skillBody" in proposal ? proposal.skillBody : proposal.suggestedSkillBody;
  const slug = proposal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const skillDir = path.join(projectDir, ".claude", "skills", slug);
  fs.mkdirSync(skillDir, { recursive: true });
  const skillPath = path.join(skillDir, "SKILL.md");
  fs.writeFileSync(skillPath, body, "utf8");
  return skillPath;
}
