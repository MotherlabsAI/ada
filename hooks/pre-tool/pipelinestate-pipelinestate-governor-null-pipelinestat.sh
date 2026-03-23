#!/bin/bash
# Invariant: pipelineState.governor !== null ? pipelineState.synthesis !== null : true
# Entity: PipelineState
# Description: governor decision cannot exist without a synthesis (Blueprint) artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.governor !== null ? pipelineState.synthesis !== null : true
exit 0
