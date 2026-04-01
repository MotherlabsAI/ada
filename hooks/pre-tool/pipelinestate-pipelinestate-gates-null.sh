#!/bin/bash
# Invariant: pipelineState.gates !== null
# Entity: PipelineState
# Description: gates record must always be present; null gates means no gate history and no provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.gates !== null
exit 0
