#!/bin/bash
# Invariant: buildArtifact.distDir !== null && buildArtifact.distDir.length > 0
# Entity: BuildArtifact
# Description: artifact must reside in a named dist directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.distDir !== null && buildArtifact.distDir.length > 0
exit 0
