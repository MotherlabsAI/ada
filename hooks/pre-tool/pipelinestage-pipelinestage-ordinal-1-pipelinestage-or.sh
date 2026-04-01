#!/bin/bash
# Invariant: pipelineStage.ordinal >= 1 && pipelineStage.ordinal <= 9
# Entity: PipelineStage
# Description: ordinal must map to exactly one of the 9 defined stages — no stage outside this range is valid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.ordinal >= 1 && pipelineStage.ordinal <= 9
exit 0
