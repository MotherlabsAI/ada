#!/bin/bash
# Invariant: buildArtifact.jsFiles.length > 0
# Entity: BuildArtifact
# Description: a build artifact must contain at least one compiled JS file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.jsFiles.length > 0
exit 0
