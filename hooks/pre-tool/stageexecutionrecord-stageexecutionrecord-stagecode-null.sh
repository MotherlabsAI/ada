#!/bin/bash
# Invariant: stageExecutionRecord.stageCode !== null
# Entity: StageExecutionRecord
# Description: Stage code must be present — a record without stage identification cannot be placed in the compilation run sequence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.stageCode !== null
exit 0
