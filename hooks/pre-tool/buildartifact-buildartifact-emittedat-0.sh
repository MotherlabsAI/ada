#!/bin/bash
# Invariant: buildArtifact.emittedAt > 0
# Entity: BuildArtifact
# Description: artifact must record a non-zero emission timestamp
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.emittedAt > 0
exit 0
