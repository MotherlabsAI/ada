#!/bin/bash
# Invariant: pnpmWorkspace.workspaceYamlPath !== null
# Entity: PnpmWorkspace
# Description: workspace must have a pnpm-workspace.yaml path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pnpmWorkspace.workspaceYamlPath !== null
exit 0
