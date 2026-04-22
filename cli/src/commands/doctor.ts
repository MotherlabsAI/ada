// ═══════════════════════════════════════════════════════════════════════════════
// ada doctor — environment health diagnostic
// Runs a set of checks and prints each with a status glyph and a one-line note.
// Exits 0 if all pass, 1 if any check fails.
// ═══════════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { existsSync, accessSync, constants, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { glyphs } from "../ui/design-system.js";

type Status = "pass" | "fail" | "warn" | "info";

interface CheckResult {
  id: string;
  status: Status;
  note: string;
}

const PASS = glyphs.status.pass; // ✓
const FAIL = glyphs.status.fail; // ✗
const WARN = "⚠"; // ⚠
const INFO = glyphs.status.disconnected; // ○

function glyphFor(status: Status): string {
  switch (status) {
    case "pass":
      return PASS;
    case "fail":
      return FAIL;
    case "warn":
      return WARN;
    case "info":
      return INFO;
  }
}

function checkNodeVersion(): CheckResult {
  const raw = process.version; // e.g. "v20.10.0"
  const match = /^v(\d+)\./.exec(raw);
  const major = match ? Number(match[1]) : 0;
  if (major >= 18) {
    return { id: "NODE_VERSION", status: "pass", note: `${raw} (>= 18)` };
  }
  return {
    id: "NODE_VERSION",
    status: "fail",
    note: `${raw} is below required v18`,
  };
}

function checkClaudeCli(): CheckResult {
  try {
    const result = spawnSync("claude", ["--version"], {
      timeout: 2000,
      encoding: "utf8",
    });
    if (result.error || result.status !== 0) {
      return {
        id: "CLAUDE_CLI",
        status: "warn",
        note: "claude CLI not found on PATH",
      };
    }
    const out = (result.stdout || result.stderr || "").trim().split("\n")[0];
    return {
      id: "CLAUDE_CLI",
      status: "pass",
      note: out || "available",
    };
  } catch {
    return {
      id: "CLAUDE_CLI",
      status: "warn",
      note: "claude CLI not found on PATH",
    };
  }
}

function checkAnthropicKey(): CheckResult {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0) {
    return {
      id: "ANTHROPIC_KEY",
      status: "pass",
      note: "ANTHROPIC_API_KEY env var set",
    };
  }
  const configPath = join(homedir(), ".ada", "config.json");
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const providers = parsed.providers as Record<string, unknown> | undefined;
      if (providers && typeof providers === "object" && "anthropic" in providers) {
        return {
          id: "ANTHROPIC_KEY",
          status: "pass",
          note: "anthropic provider configured in ~/.ada/config.json",
        };
      }
      if ("anthropic" in parsed) {
        return {
          id: "ANTHROPIC_KEY",
          status: "pass",
          note: "anthropic entry found in ~/.ada/config.json",
        };
      }
    } catch {
      // fall through to warn
    }
  }
  return {
    id: "ANTHROPIC_KEY",
    status: "warn",
    note: "no ANTHROPIC_API_KEY env var and no anthropic provider in ~/.ada/config.json",
  };
}

function checkGitRepo(): CheckResult {
  try {
    const result = spawnSync("git", ["rev-parse", "--git-dir"], {
      timeout: 2000,
      encoding: "utf8",
      cwd: process.cwd(),
    });
    if (!result.error && result.status === 0) {
      const dir = (result.stdout || "").trim();
      return {
        id: "GIT_REPO",
        status: "info",
        note: `git repo (${dir})`,
      };
    }
    return {
      id: "GIT_REPO",
      status: "info",
      note: "not a git repository",
    };
  } catch {
    return {
      id: "GIT_REPO",
      status: "info",
      note: "git not available",
    };
  }
}

function checkAdaState(): CheckResult {
  const statePath = join(process.cwd(), ".ada", "state.json");
  if (existsSync(statePath)) {
    return {
      id: "ADA_STATE",
      status: "info",
      note: `${statePath}`,
    };
  }
  return {
    id: "ADA_STATE",
    status: "info",
    note: "no .ada/state.json in CWD (run `ada init`)",
  };
}

function checkStorageDb(): CheckResult {
  const dbPath = join(homedir(), ".ada", "storage.db");
  if (!existsSync(dbPath)) {
    return {
      id: "STORAGE_DB",
      status: "info",
      note: `${dbPath} not present`,
    };
  }
  try {
    accessSync(dbPath, constants.R_OK);
    return {
      id: "STORAGE_DB",
      status: "info",
      note: `${dbPath} readable`,
    };
  } catch {
    return {
      id: "STORAGE_DB",
      status: "info",
      note: `${dbPath} exists but not readable`,
    };
  }
}

function checkPlatform(): CheckResult {
  return {
    id: "PLATFORM",
    status: "info",
    note: `${process.platform}/${process.arch}`,
  };
}

function hasOnPath(bin: string): boolean {
  try {
    const result = spawnSync("command", ["-v", bin], {
      timeout: 1500,
      encoding: "utf8",
      shell: "/bin/sh",
    });
    if (!result.error && result.status === 0 && (result.stdout || "").trim().length > 0) {
      return true;
    }
  } catch {
    // fall through to which
  }
  try {
    const result = spawnSync("which", [bin], {
      timeout: 1500,
      encoding: "utf8",
    });
    return !result.error && result.status === 0 && (result.stdout || "").trim().length > 0;
  } catch {
    return false;
  }
}

function checkTerminalSpawn(): CheckResult | null {
  if (process.platform !== "linux") return null;
  const candidates = [
    "xdg-open",
    "x-terminal-emulator",
    "gnome-terminal",
    "konsole",
    "xterm",
  ];
  const found = candidates.filter((bin) => hasOnPath(bin));
  if (found.length > 0) {
    return {
      id: "TERMINAL_SPAWN",
      status: "pass",
      note: `found: ${found.join(", ")}`,
    };
  }
  return {
    id: "TERMINAL_SPAWN",
    status: "warn",
    note: `no terminal launcher on PATH (checked: ${candidates.join(", ")})`,
  };
}

export async function doctorCommand(): Promise<void> {
  const results: CheckResult[] = [];

  results.push(checkNodeVersion());
  results.push(checkClaudeCli());
  results.push(checkAnthropicKey());
  results.push(checkGitRepo());
  results.push(checkAdaState());
  results.push(checkStorageDb());
  results.push(checkPlatform());
  const term = checkTerminalSpawn();
  if (term) results.push(term);

  const idWidth = Math.max(...results.map((r) => r.id.length));

  process.stdout.write("ada doctor\n\n");
  for (const r of results) {
    const g = glyphFor(r.status);
    const paddedId = r.id.padEnd(idWidth, " ");
    process.stdout.write(`  ${g}  ${paddedId}  ${r.note}\n`);
  }
  process.stdout.write("\n");

  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const passed = results.filter((r) => r.status === "pass").length;

  process.stdout.write(
    `summary: ${passed} pass, ${warned} warn, ${failed} fail\n`,
  );

  process.exit(failed > 0 ? 1 : 0);
}
