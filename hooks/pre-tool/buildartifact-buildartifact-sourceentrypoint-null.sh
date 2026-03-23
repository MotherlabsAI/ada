#!/bin/bash
# Invariant: buildArtifact.sourceEntryPoint !== null
# Entity: BuildArtifact
# Description: build artifact must trace back to a source entry point
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildArtifact.sourceEntryPoint !== null
exit 0
