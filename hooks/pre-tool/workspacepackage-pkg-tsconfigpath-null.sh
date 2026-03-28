#!/bin/bash
# Invariant: pkg.tsConfigPath !== null
# Entity: WorkspacePackage
# Description: a package without a tsconfig cannot participate in TypeScript compilation — G10 fails
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.tsConfigPath !== null
exit 0
