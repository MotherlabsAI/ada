#!/bin/bash
# Invariant: pipelineState.cumulativeEntropy >= 0
# Entity: PipelineState
# Description: Cumulative entropy must be non-negative — negative entropy has no semantic meaning in drift measurement
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.cumulativeEntropy >= 0
exit 0
