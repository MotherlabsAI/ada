#!/bin/bash
# Invariant: runArtifact.immutable === true
# Entity: RunArtifact
# Description: a run artifact is always immutable after creation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.immutable === true
exit 0
