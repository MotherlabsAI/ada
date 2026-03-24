#!/bin/bash
# Invariant: runArtifact.createdAt > 0
# Entity: RunArtifact
# Description: Artifact must be timestamped — unordered artifacts corrupt run reconstruction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.createdAt > 0
exit 0
