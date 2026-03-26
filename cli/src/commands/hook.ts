import * as fs from "fs";
import * as path from "path";

// Pre-push hook script installed by `ada hook install`.
// Runs `ada verify` before every push — blocks on critical violations.
const HOOK_SCRIPT = `#!/bin/sh
# Ada semantic drift detection — installed by 'ada hook install'
# Runs ada verify before every push to catch semantic violations.
# Remove with: ada hook uninstall

echo "  ◈  ada verify — checking codebase against blueprint..."
ada verify
EXIT=$?

if [ $EXIT -eq 2 ]; then
  echo ""
  echo "  ✗  semantic violations found — see .ada/drift.md"
  echo "  ✗  resolve before pushing, or run git push --no-verify to bypass"
  echo ""
  exit 1
fi

exit 0
`;

function findGitRoot(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function hookCommand(args: string[]): void {
  const action = args[0];
  const gitRoot = findGitRoot(process.cwd());

  if (!gitRoot) {
    console.error("  Error: not inside a git repository");
    process.exit(1);
  }

  const hooksDir = path.join(gitRoot, ".git", "hooks");
  const hookPath = path.join(hooksDir, "pre-push");
  const backupPath = hookPath + ".ada-backup";

  switch (action) {
    case "install": {
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      if (fs.existsSync(hookPath)) {
        const existing = fs.readFileSync(hookPath, "utf8");
        if (existing.includes("ada verify")) {
          console.log("  ◈  Ada pre-push hook already installed");
          return;
        }
        // Back up the existing hook before replacing
        fs.copyFileSync(hookPath, backupPath);
        console.log(
          `  ◈  existing hook backed up → ${path.relative(gitRoot, backupPath)}`,
        );
      }

      fs.writeFileSync(hookPath, HOOK_SCRIPT, { mode: 0o755 });
      console.log("  ✓  Ada pre-push hook installed");
      console.log("  ✓  ada verify runs before every push");
      console.log("  ✓  violations block the push and write .ada/drift.md");
      console.log("\n  To uninstall: ada hook uninstall");
      break;
    }

    case "uninstall": {
      if (!fs.existsSync(hookPath)) {
        console.log("  ◈  no pre-push hook found");
        return;
      }

      const existing = fs.readFileSync(hookPath, "utf8");
      if (!existing.includes("ada verify")) {
        console.error(
          "  Error: pre-push hook was not installed by Ada — not removing",
        );
        process.exit(1);
      }

      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, hookPath);
        fs.unlinkSync(backupPath);
        console.log("  ✓  previous hook restored");
      } else {
        fs.unlinkSync(hookPath);
        console.log("  ✓  Ada pre-push hook removed");
      }
      break;
    }

    default:
      console.log(`
  Usage:
    ada hook install     Install pre-push hook — ada verify runs before every push
    ada hook uninstall   Remove the hook
`);
  }
}
