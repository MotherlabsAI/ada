#!/bin/bash
# Invariant: stageExecutionRecord.metadata !== null
# Entity: StageExecutionRecord
# Description: Determinism metadata must be present — without model and temperature records, reproducibility cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.metadata !== null
exit 0
