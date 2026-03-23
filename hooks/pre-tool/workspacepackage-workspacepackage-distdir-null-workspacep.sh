#!/bin/bash
# Invariant: workspacePackage.distDir !== null && workspacePackage.distDir.length > 0
# Entity: WorkspacePackage
# Description: package must declare a dist output directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackage.distDir !== null && workspacePackage.distDir.length > 0
exit 0
