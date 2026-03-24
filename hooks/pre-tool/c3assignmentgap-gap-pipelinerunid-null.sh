#!/bin/bash
# Invariant: gap.pipelineRunId !== null
# Entity: C3AssignmentGap
# Description: C3 gap must be anchored to the specific pipeline run it blocks — without this anchor the gap cannot be correlated to run ML.ENT.e80e3c97/v1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.pipelineRunId !== null
exit 0
