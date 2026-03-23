#!/bin/bash
# Invariant: priorRunArtifact.runId !== null
# Entity: PriorRunArtifact
# Description: artifact must be traceable to its originating run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: priorRunArtifact.runId !== null
exit 0
