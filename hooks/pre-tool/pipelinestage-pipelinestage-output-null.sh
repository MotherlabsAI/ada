#!/bin/bash
# Invariant: pipelineStage.output !== null
# Entity: PipelineStage
# Description: a stage with null output has not completed — it cannot have passed its gate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineStage.output !== null
exit 0
