#!/bin/bash
# Invariant: pkg.packageName !== null && pkg.packageName.length > 0
# Entity: WorkspacePackageNode
# Description: package node must be named — a nameless package cannot serve as the middle hop in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.packageName !== null && pkg.packageName.length > 0
exit 0
