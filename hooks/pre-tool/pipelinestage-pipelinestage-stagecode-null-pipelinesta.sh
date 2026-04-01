#!/bin/bash
# Invariant: pipelineStage.stageCode !== null && pipelineStage.stageCode.length > 0
# Entity: PipelineStage
# Description: every stage must have a non-empty stage code identifying it within the canonical sequence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.stageCode !== null && pipelineStage.stageCode.length > 0
exit 0
