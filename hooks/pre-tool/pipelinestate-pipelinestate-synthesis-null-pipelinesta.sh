#!/bin/bash
# Invariant: pipelineState.synthesis !== null ? pipelineState.entity !== null : true
# Entity: PipelineState
# Description: Blueprint synthesis requires a prior EntityMap — skipping ENT stage violates pipeline ordering
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.synthesis !== null ? pipelineState.entity !== null : true
exit 0
