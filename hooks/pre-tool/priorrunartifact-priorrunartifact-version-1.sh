#!/bin/bash
# Invariant: priorRunArtifact.version >= 1
# Entity: PriorRunArtifact
# Description: prior run artifacts are at least version 1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: priorRunArtifact.version >= 1
exit 0
