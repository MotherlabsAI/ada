---
name: glass-box-verify
description: "Use after any glass-box-agent file change to verify build + design system compliance."
---

# Glass box verification

Run after every file change in cli/src/ui/ or agent prompt changes.

## Steps

1. Build check

```bash
cd /Users/motherlabs/Desktop/ada-claude && NODE_OPTIONS="--max-old-space-size=4096" pnpm -r build
```

2. No `any` types

```bash
grep -rn ": any[^t]" cli/src/ui/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

3. No pure white/black

```bash
grep -rn "#ffffff\|#000000" cli/src/ui/ --include="*.ts" --include="*.tsx"
```

4. No emoji

```bash
grep -Prn "[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}]" cli/src/ui/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "clean"
```

5. All colors from palette

```bash
grep -rn "color=" cli/src/ui/ --include="*.tsx" | grep -v "palette\." | grep -v "color={" | head -10
```

6. Design system import check

```bash
for f in cli/src/ui/*.tsx; do
  if ! grep -q "design-system" "$f" 2>/dev/null; then
    echo "MISSING design-system import: $f"
  fi
done
```

All 6 must pass. If any fail, fix before proceeding to next step.
