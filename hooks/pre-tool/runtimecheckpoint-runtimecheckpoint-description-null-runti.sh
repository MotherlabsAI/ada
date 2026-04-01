#!/bin/bash
# Invariant: runtimeCheckpoint.description !== null && runtimeCheckpoint.description.length > 0
# Entity: RuntimeCheckpoint
# Description: description must be non-empty to orient human reviewers consulting checkpoint history
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtimeCheckpoint.description !== null && runtimeCheckpoint.description.length > 0
exit 0
