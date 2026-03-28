#!/bin/bash
# Invariant: node.packageName !== null && node.packageName.length > 0
# Entity: WorkspacePackageNode
# Description: a package node without a name cannot be referenced in the mapping or by pnpm
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: node.packageName !== null && node.packageName.length > 0
exit 0
