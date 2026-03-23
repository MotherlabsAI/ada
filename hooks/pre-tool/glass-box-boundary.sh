#!/bin/bash
# Enforces glass-box-agent bounded context.
# Blocks writes to files the glass box agent doesn't own.
# Only active when ADA_GLASS_BOX_MODE=1

if [ "$ADA_GLASS_BOX_MODE" != "1" ]; then
  exit 0
fi

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // empty' 2>/dev/null)

# Allow UI files
echo "$FILE" | grep -q "cli/src/ui/" && exit 0

# Allow init.ts
echo "$FILE" | grep -q "cli/src/commands/init.ts" && exit 0

# Allow agent prompt files (but check it's prompt-only changes)
echo "$FILE" | grep -q "packages/compiler/src/agents/" && exit 0

# Allow build commands
echo "$FILE" | grep -q "pnpm\|tsc\|node" && exit 0

# Allow read-only operations
echo "$INPUT" | jq -r '.tool' 2>/dev/null | grep -q "Read\|Glob\|Grep" && exit 0

# Block everything else
echo "glass-box-agent boundary: cannot modify $FILE" >&2
echo "you own: cli/src/ui/**, cli/src/commands/init.ts, agents/*.ts (prompts only)" >&2
exit 2
