#!/bin/bash
# Invariant: statelessReRun.targetStageRunId !== null
# Entity: StatelessReRun
# Description: re-run must reference the specific INT stage run ID for traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: statelessReRun.targetStageRunId !== null
exit 0
