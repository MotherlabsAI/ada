#!/bin/bash
# Invariant: sessionCheckpoint.blueprint !== null
# Entity: SessionCheckpoint
# Description: Checkpoint must carry a blueprint — without the blueprint state the checkpoint has no recovery value
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sessionCheckpoint.blueprint !== null
exit 0
