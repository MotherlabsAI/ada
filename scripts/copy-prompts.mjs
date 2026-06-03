#!/usr/bin/env node
/**
 * copy-prompts — make the built CLI runnable from ANY cwd.
 *
 * `tsc` does not copy non-TS assets, so the versioned excavator prompts
 * (`src/compile/prompts/*.md`) never land in `dist/`. excavate.ts resolves the
 * prompt dir relative to its own module (the sibling `../prompts` inside dist),
 * so we mirror the source prompts into `dist/compile/prompts/` after compilation.
 *
 * Zero dependencies: node:fs + node:url + node:path only. Cross-platform.
 * Wired into `pnpm build` as `tsc ... && node scripts/copy-prompts.mjs`.
 */
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "compile", "prompts");
const dest = join(root, "dist", "compile", "prompts");

if (!existsSync(src)) {
  console.error(`copy-prompts: source prompts not found at ${src}`);
  process.exit(1);
}

// recursive copy of the whole prompts tree (.md files); overwrites stale copies.
cpSync(src, dest, { recursive: true });
console.log(`copy-prompts: ${src} -> ${dest}`);
