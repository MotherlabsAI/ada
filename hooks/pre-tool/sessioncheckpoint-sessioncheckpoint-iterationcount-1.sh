#!/bin/bash
# Invariant: sessionCheckpoint.iterationCount >= 1
# Entity: SessionCheckpoint
# Description: Iteration count must be at least 1 — a checkpoint implies at least one pipeline iteration has completed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sessionCheckpoint.iterationCount >= 1
exit 0
