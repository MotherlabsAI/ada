#!/bin/bash
# Warn and block `any` type in written TypeScript files
INPUT=$(cat)
PATH_ARG=$(echo "$INPUT" | jq -r '.tool_input.path // ""')
if echo "$PATH_ARG" | grep -q "\.ts$"; then
  if grep -Pn ":\s*any\b" "$PATH_ARG" 2>/dev/null; then
    echo "Ada invariant violated: \`any\` type found in $PATH_ARG. Use explicit types." >&2
    exit 2
  fi
fi
exit 0
