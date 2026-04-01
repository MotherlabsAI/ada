#!/bin/bash
# Invariant: entGateRecord.pipelineRunId !== null && entGateRecord.pipelineRunId.length > 0
# Entity: ENTGateRecord
# Description: pipelineRunId must be non-null — the gate record must be anchored to a specific run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.pipelineRunId !== null && entGateRecord.pipelineRunId.length > 0
exit 0
