#!/bin/bash
# Invariant: workspacePackage.srcDir !== null
# Entity: WorkspacePackage
# Description: package must declare a source directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackage.srcDir !== null
exit 0
