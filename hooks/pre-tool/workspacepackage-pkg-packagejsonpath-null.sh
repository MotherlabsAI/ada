#!/bin/bash
# Invariant: pkg.packageJsonPath !== null
# Entity: WorkspacePackage
# Description: a package without a package.json is not a valid pnpm workspace member
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.packageJsonPath !== null
exit 0
