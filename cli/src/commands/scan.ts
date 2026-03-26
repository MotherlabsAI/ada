import * as path from "path";
import { analyzeCodebase } from "@ada/compiler";
import { glyphs } from "../ui/design-system.js";

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = indent;
  for (const word of words) {
    if (current === indent) {
      current += word;
    } else if (current.length + 1 + word.length > width) {
      lines.push(current);
      current = indent + word;
    } else {
      current += " " + word;
    }
  }
  if (current !== indent) lines.push(current);
  return lines.join("\n");
}

export async function scanCommand(): Promise<void> {
  const cwd = process.cwd();
  const sep = glyphs.identity.core; // ◈
  const cols = Math.min(process.stdout.columns ?? 80, 72);
  const bar = "─".repeat(cols - 2);

  console.log(`\n  ${sep}  scanning codebase...\n`);

  const ctx = analyzeCodebase(cwd);

  const typeCount = ctx.typeRegistry.length;
  const constCount = ctx.constants.length;
  const pkgCount = ctx.packageBoundaries.length;

  if (typeCount === 0 && constCount === 0) {
    console.log(
      `  no TypeScript sources found in ${path.relative(process.env["HOME"] ?? "/", cwd) || cwd}\n`,
    );
    console.log(`  ada will compile without codebase vocabulary grounding.\n`);
    return;
  }

  console.log(`  ${bar}\n`);

  // ── Packages ────────────────────────────────────────────────────────────
  if (pkgCount > 0) {
    console.log(`  ${sep}  packages  (${pkgCount})\n`);
    for (const pkg of ctx.packageBoundaries) {
      const depStr =
        pkg.dependencies.length > 0
          ? `  →  ${pkg.dependencies.slice(0, 3).join(", ")}${pkg.dependencies.length > 3 ? ` +${pkg.dependencies.length - 3}` : ""}`
          : "";
      console.log(`    ${glyphs.pipeline.separator}  ${pkg.name}${depStr}`);
      if (pkg.types.length > 0) {
        const preview = pkg.types.slice(0, 6).join(", ");
        const more =
          pkg.types.length > 6 ? ` … +${pkg.types.length - 6} more` : "";
        console.log(wrapText(`      types: ${preview}${more}`, cols, "      "));
      }
    }
    console.log("");
  }

  // ── Vocabulary ──────────────────────────────────────────────────────────
  if (ctx.vocabulary.length > 0) {
    console.log(
      `  ${sep}  vocabulary  (${ctx.vocabulary.length} type names)\n`,
    );
    const preview = ctx.vocabulary.slice(0, 12).join(", ");
    const more =
      ctx.vocabulary.length > 12
        ? ` … +${ctx.vocabulary.length - 12} more`
        : "";
    console.log(wrapText(`    ${preview}${more}`, cols, "    "));
    console.log("");
  }

  // ── Constants ───────────────────────────────────────────────────────────
  if (ctx.constants.length > 0) {
    console.log(`  ${sep}  constants  (${ctx.constants.length})\n`);
    for (const c of ctx.constants.slice(0, 8)) {
      console.log(`    ${glyphs.pipeline.separator}  ${c.name} = ${c.value}`);
    }
    if (ctx.constants.length > 8) {
      console.log(`    … and ${ctx.constants.length - 8} more`);
    }
    console.log("");
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  console.log(`  ${bar}`);
  console.log(
    `  ${pkgCount} package${pkgCount !== 1 ? "s" : ""}  ${glyphs.pipeline.separator}  ${typeCount} types  ${glyphs.pipeline.separator}  ${constCount} constants`,
  );
  console.log(`  ${bar}`);
  console.log(
    `\n  this vocabulary is injected into the compilation pipeline.\n  run ${glyphs.identity.core} ada compile to use it.\n`,
  );
}
