#!/bin/bash
# Invariant: adaMonorepo.workspaceRoot !== null
# Entity: AdaMonorepo
# Description: workspace root path must be defined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaMonorepo.workspaceRoot !== null
exit 0
