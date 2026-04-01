#!/bin/bash
# Invariant: pipelineState.entity !== null ? pipelineState.intent !== null : true
# Entity: PipelineState
# Description: EntityMap extraction requires a prior IntentGraph — the ENT stage depends on INT output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineState.entity !== null ? pipelineState.intent !== null : true
exit 0
