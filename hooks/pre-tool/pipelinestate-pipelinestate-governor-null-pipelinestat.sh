#!/bin/bash
# Invariant: pipelineState.governor !== null ? pipelineState.synthesis !== null : true
# Entity: PipelineState
# Description: a GovernorDecision cannot exist without a prior Blueprint synthesis — the governor evaluates the synthesis
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.governor !== null ? pipelineState.synthesis !== null : true
exit 0
