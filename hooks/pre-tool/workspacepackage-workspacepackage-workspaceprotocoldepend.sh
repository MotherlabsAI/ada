#!/bin/bash
# Invariant: workspacePackage.workspaceProtocolDependencies !== null
# Entity: WorkspacePackage
# Description: workspace dependencies array must be defined (may be empty)
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackage.workspaceProtocolDependencies !== null
exit 0
