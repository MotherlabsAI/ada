#!/bin/bash
# Invariant: sessionCheckpoint.sessionId !== null && sessionCheckpoint.sessionId.length > 0
# Entity: SessionCheckpoint
# Description: Checkpoint must reference a session — a checkpoint without a session cannot be restored by the orchestrator
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sessionCheckpoint.sessionId !== null && sessionCheckpoint.sessionId.length > 0
exit 0
