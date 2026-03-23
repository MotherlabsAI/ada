#!/bin/bash
# Invariant: entityBinding.runId !== null && entityBinding.runId.length > 0
# Entity: EntityBinding
# Description: binding must be scoped to a run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.runId !== null && entityBinding.runId.length > 0
exit 0
