#!/bin/bash
# Invariant: intStage.runId !== null && intStage.runId.length > 0
# Entity: INTStage
# Description: run ID must be a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.runId !== null && intStage.runId.length > 0
exit 0
