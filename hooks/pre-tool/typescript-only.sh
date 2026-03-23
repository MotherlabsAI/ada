#!/bin/bash
# Block non-TypeScript source files in src/ directories
INPUT=$(cat)
PATH_ARG=$(echo "$INPUT" | jq -r '.tool_input.path // ""')
if echo "$PATH_ARG" | grep -q "/src/"; then
  if ! echo "$PATH_ARG" | grep -qE "\.(ts|json|md|sh|sql)$"; then
    echo "Ada invariant violated: source files must be TypeScript (.ts). Got: $PATH_ARG" >&2
    exit 2
  fi
fi
exit 0
