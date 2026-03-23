#!/bin/bash
# Invariant: pipelineState.cumulativeEntropy >= 0 && pipelineState.cumulativeEntropy <= 1
# Entity: PipelineState
# Description: cumulative entropy must remain in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.cumulativeEntropy >= 0 && pipelineState.cumulativeEntropy <= 1
exit 0
