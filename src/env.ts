/**
 * Local credential/config loader (zero-dep). Ada reads `ANTHROPIC_API_KEY` (and optionally
 * `ADA_MODEL`) from a local dotenv-style file so the key is set ONCE instead of exported every
 * session. AXIOM A9 (sovereignty): the key stays on the user's filesystem and is only ever
 * used for the single compile-time model call (in `engine/model.ts`) — never logged, never
 * transmitted anywhere else. This module reads files and sets `process.env`; it does not make
 * any network call and never returns or logs the secret value.
 *
 * Precedence: a value already in `process.env` ALWAYS wins (env > file). Files are tried in
 * order; the first file to provide a given key wins.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** The only keys Ada will populate from a config file. */
const KEYS = ["ANTHROPIC_API_KEY", "ADA_MODEL"] as const;
type Key = (typeof KEYS)[number];

/** Parse dotenv-style text → map. Tolerates comments (#), blank lines, `export `, and quotes. */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let val = m[2]!.trim();
    if (
      val.length >= 2 &&
      ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]!] = val;
  }
  return out;
}

/** Candidate config files, in precedence order (first to provide a key wins). */
export function configCandidates(cwd: string = process.cwd()): string[] {
  return [join(cwd, ".env"), join(homedir(), ".ada", ".env")];
}

export interface EnvLoadResult {
  /** Names of keys populated from a file (NOT their values). */
  loaded: Key[];
  /** The file `ANTHROPIC_API_KEY` came from (value-free), or null. */
  source: string | null;
}

/**
 * Populate `env` for the known keys from the candidate files WITHOUT overriding a value that
 * is already set (env wins). Returns which keys loaded + the source file. The secret VALUES
 * are never logged or returned. Unreadable files are skipped silently.
 */
export function loadEnvConfig(
  files: string[] = configCandidates(),
  env: NodeJS.ProcessEnv = process.env,
): EnvLoadResult {
  const loaded: Key[] = [];
  let source: string | null = null;
  for (const file of files) {
    if (!existsSync(file)) continue;
    let parsed: Record<string, string>;
    try {
      parsed = parseEnvFile(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const k of KEYS) {
      const cur = env[k];
      if ((cur === undefined || cur === "") && parsed[k]) {
        env[k] = parsed[k];
        if (!loaded.includes(k)) loaded.push(k);
        if (k === "ANTHROPIC_API_KEY") source = source ?? file;
      }
    }
  }
  return { loaded, source };
}
