import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Amendment {
  id: string;
  createdAt: number;
  stage: string;
  field: string;
  original: string | null;
  proposed: string;
  rationale: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: number;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

function getProjectDir(): string {
  return (
    process.env["ADA_PROJECT_DIR"] ??
    process.env["CLAUDE_PROJECT_DIR"] ??
    process.cwd()
  );
}

function amendmentsDir(d: string): string {
  return path.join(d, ".ada", "amendments");
}

// ─── I/O ─────────────────────────────────────────────────────────────────────

function loadPending(
  projectDir: string,
): Array<{ file: string; record: Amendment }> {
  const dir = amendmentsDir(projectDir);
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort() // chronological (ts prefix)
      .map((f) => {
        try {
          const raw = fs.readFileSync(path.join(dir, f), "utf8");
          const record = JSON.parse(raw) as Amendment;
          return record.status === "pending" ? { file: f, record } : null;
        } catch {
          return null;
        }
      })
      .filter((x): x is { file: string; record: Amendment } => x !== null);
  } catch {
    return [];
  }
}

function updateStatus(
  projectDir: string,
  file: string,
  status: "approved" | "rejected",
): void {
  const filePath = path.join(amendmentsDir(projectDir), file);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const record = JSON.parse(raw) as Amendment;
    record.status = status;
    record.reviewedAt = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");
  } catch {
    // best-effort
  }
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ─── Command ──────────────────────────────────────────────────────────────────

export async function reviewAmendmentsCommand(): Promise<void> {
  const projectDir = getProjectDir();
  const pending = loadPending(projectDir);

  if (pending.length === 0) {
    console.log("");
    console.log("  No pending amendments.");
    console.log(
      "  Amendments are proposed by Claude Code via ada.propose_amendment.",
    );
    console.log("");
    return;
  }

  console.log("");
  console.log(`  ◈ ada review-amendments — ${pending.length} pending`);
  console.log("  Approved amendments trigger a blueprint re-compilation.");
  console.log("  Rejected amendments are archived — not applied.");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let approved = 0;
  let rejected = 0;

  for (const { file, record } of pending) {
    const age = Math.round((Date.now() - record.createdAt) / 60000);
    const ageStr = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;

    console.log(`  ┌─ [${record.stage}.${record.field}]  ${ageStr}`);
    console.log(`  │  Rationale: ${record.rationale}`);
    if (record.original) {
      console.log("  │");
      console.log("  │  Current:");
      for (const line of record.original.split("\n").slice(0, 4)) {
        console.log(`  │    ${line}`);
      }
    }
    console.log("  │");
    console.log("  │  Proposed:");
    for (const line of record.proposed.split("\n").slice(0, 8)) {
      console.log(`  │    ${line}`);
    }
    if (record.proposed.split("\n").length > 8) {
      console.log(
        `  │    ... (${record.proposed.split("\n").length - 8} more lines)`,
      );
    }
    console.log("  └─");
    console.log("");

    const answer = await ask(rl, "  Approve (a), Reject (r), or Skip (s)? ");
    const choice = answer.trim().toLowerCase();

    if (choice === "a" || choice === "approve") {
      updateStatus(projectDir, file, "approved");
      console.log("  ✓ Approved.");
      approved++;
    } else if (choice === "r" || choice === "reject") {
      updateStatus(projectDir, file, "rejected");
      console.log("  ✗ Rejected — archived.");
      rejected++;
    } else {
      console.log("  — Skipped.");
    }
    console.log("");
  }

  rl.close();

  console.log(`  Review complete: ${approved} approved, ${rejected} rejected.`);
  console.log("");

  if (approved > 0) {
    console.log("  Approved amendments are staged. To apply them:");
    console.log("");
    console.log('    ada compile --amend "<original intent or new intent>"');
    console.log("");
    console.log(
      "  The compiler reads approved amendments as prior context and",
    );
    console.log("  re-runs the affected pipeline stages with the corrections.");
    console.log("");
  }
}
