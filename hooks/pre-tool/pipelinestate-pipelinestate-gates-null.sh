#!/bin/bash
# Invariant: pipelineState.gates !== null
# Entity: PipelineState
# Description: gate registry must exist even if empty; a null gates map makes provenance lookups undefined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.gates !== null
exit 0
