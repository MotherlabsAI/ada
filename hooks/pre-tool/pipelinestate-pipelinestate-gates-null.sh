#!/bin/bash
# Invariant: pipelineState.gates !== null
# Entity: PipelineState
# Description: Gates record must be initialized — a pipeline with no gate map cannot enforce provenance checkpoints
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.gates !== null
exit 0
