#!/bin/bash
# Invariant: runArtifact.runId !== null && runArtifact.runId.length > 0
# Entity: RunArtifact
# Description: artifact must carry its own runId
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runArtifact.runId !== null && runArtifact.runId.length > 0
exit 0
