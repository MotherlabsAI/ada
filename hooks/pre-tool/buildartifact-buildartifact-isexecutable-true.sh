#!/bin/bash
# Invariant: buildArtifact.isExecutable === true
# Entity: BuildArtifact
# Description: a CLI build artifact must be marked executable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.isExecutable === true
exit 0
