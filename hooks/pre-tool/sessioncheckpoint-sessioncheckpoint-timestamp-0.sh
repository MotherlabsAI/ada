#!/bin/bash
# Invariant: sessionCheckpoint.timestamp > 0
# Entity: SessionCheckpoint
# Description: Checkpoint must be timestamped — unordered checkpoints cannot be used to determine the latest recoverable state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sessionCheckpoint.timestamp > 0
exit 0
