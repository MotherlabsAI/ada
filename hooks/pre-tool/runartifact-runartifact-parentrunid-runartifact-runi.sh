#!/bin/bash
# Invariant: runArtifact.parentRunId !== runArtifact.runId
# Entity: RunArtifact
# Description: an artifact cannot reference itself as its own parent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.parentRunId !== runArtifact.runId
exit 0
