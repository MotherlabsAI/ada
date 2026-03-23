#!/bin/bash
# Invariant: adaMonorepo.packageManager === 'pnpm'
# Entity: AdaMonorepo
# Description: package manager is invariantly pnpm
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaMonorepo.packageManager === 'pnpm'
exit 0
