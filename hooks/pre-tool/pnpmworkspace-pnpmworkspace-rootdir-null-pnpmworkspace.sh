#!/bin/bash
# Invariant: pnpmWorkspace.rootDir !== null && pnpmWorkspace.rootDir.length > 0
# Entity: PnpmWorkspace
# Description: workspace must have a root directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pnpmWorkspace.rootDir !== null && pnpmWorkspace.rootDir.length > 0
exit 0
