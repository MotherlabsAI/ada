#!/bin/bash
# Invariant: pkg.packageName !== null && pkg.packageName.length > 0
# Entity: WorkspacePackage
# Description: a workspace package without a name cannot be referenced by pnpm or by ComponentPackageMapping
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.packageName !== null && pkg.packageName.length > 0
exit 0
