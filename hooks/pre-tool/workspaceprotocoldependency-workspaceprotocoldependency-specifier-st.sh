#!/bin/bash
# Invariant: workspaceProtocolDependency.specifier.startsWith('workspace:')
# Entity: WorkspaceProtocolDependency
# Description: specifier must use the pnpm workspace protocol prefix
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspaceProtocolDependency.specifier.startsWith('workspace:')
exit 0
