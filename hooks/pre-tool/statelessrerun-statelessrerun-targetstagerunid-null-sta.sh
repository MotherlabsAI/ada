#!/bin/bash
# Invariant: statelessReRun.targetStageRunId !== null && statelessReRun.targetStageRunId.length > 0
# Entity: StatelessReRun
# Description: Target stage run ID must be non-empty — the re-run must be anchored to a specific prior run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: statelessReRun.targetStageRunId !== null && statelessReRun.targetStageRunId.length > 0
exit 0
