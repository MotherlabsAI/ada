#!/bin/bash
# Invariant: buildArtifact.producedBy !== null
# Entity: BuildArtifact
# Description: artifact must reference the build step that created it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.producedBy !== null
exit 0
