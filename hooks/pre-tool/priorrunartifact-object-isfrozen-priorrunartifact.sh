#!/bin/bash
# Invariant: Object.isFrozen(priorRunArtifact)
# Entity: PriorRunArtifact
# Description: prior run artifact is immutable; int-rerun must never mutate it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.isFrozen(priorRunArtifact)
exit 0
