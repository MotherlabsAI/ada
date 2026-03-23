#!/bin/bash
# Invariant: buildArtifact.path !== null && buildArtifact.path.length > 0
# Entity: BuildArtifact
# Description: artifact must have a non-empty output path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.path !== null && buildArtifact.path.length > 0
exit 0
