#!/bin/bash
# Invariant: pipelineState.entity !== null ? pipelineState.persona !== null : true
# Entity: PipelineState
# Description: EntityMap cannot exist without prior DomainContext — stages must be sequential
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.entity !== null ? pipelineState.persona !== null : true
exit 0
