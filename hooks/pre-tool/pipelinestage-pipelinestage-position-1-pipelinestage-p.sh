#!/bin/bash
# Invariant: pipelineStage.position >= 1 && pipelineStage.position <= 9
# Entity: PipelineStage
# Description: position must be in [1,9] — stages execute in fixed sequential order
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.position >= 1 && pipelineStage.position <= 9
exit 0
