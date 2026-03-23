#!/bin/bash
# Invariant: pnpmWorkspace.packages.length > 0
# Entity: PnpmWorkspace
# Description: workspace must contain at least one package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pnpmWorkspace.packages.length > 0
exit 0
