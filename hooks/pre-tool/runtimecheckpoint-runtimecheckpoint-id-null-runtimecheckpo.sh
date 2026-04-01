#!/bin/bash
# Invariant: runtimeCheckpoint.id !== null && runtimeCheckpoint.id.length > 0
# Entity: RuntimeCheckpoint
# Description: checkpoints must be uniquely identifiable — anonymous checkpoints cannot be targeted by rollback_to
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtimeCheckpoint.id !== null && runtimeCheckpoint.id.length > 0
exit 0
