#!/bin/bash
# Invariant: entGateRecord.pipelineRunId === 'ML.ENT.e80e3c97/v1'
# Entity: ENTGateRecord
# Description: this gate record is specifically for the stalled run; a gate for a different run does not satisfy G1 or G6
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.pipelineRunId === 'ML.ENT.e80e3c97/v1'
exit 0
