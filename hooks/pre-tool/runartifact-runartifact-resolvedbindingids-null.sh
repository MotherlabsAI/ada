#!/bin/bash
# Invariant: runArtifact.resolvedBindingIds !== null
# Entity: RunArtifact
# Description: resolved binding list is always present, even if empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.resolvedBindingIds !== null
exit 0
