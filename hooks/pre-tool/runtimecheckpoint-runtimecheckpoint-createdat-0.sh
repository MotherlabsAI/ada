#!/bin/bash
# Invariant: runtimeCheckpoint.createdAt > 0
# Entity: RuntimeCheckpoint
# Description: checkpoints must record creation time — undated checkpoints cannot be ordered for rollback selection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtimeCheckpoint.createdAt > 0
exit 0
