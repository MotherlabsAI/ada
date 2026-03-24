#!/bin/bash
# Invariant: !(pipelineState.synthesis !== null && pipelineState.entity === null)
# Entity: PipelineState
# Description: Synthesis cannot exist without entity map — Blueprint depends on EntityMap as a structural precondition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(pipelineState.synthesis !== null && pipelineState.entity === null)
exit 0
