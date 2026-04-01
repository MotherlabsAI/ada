#!/bin/bash
# Invariant: handoffRecord.targetPipelineStage !== null
# Entity: HandoffRecord
# Description: targetPipelineStage must be non-null — the handoff must specify where in the pipeline compilation begins
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.targetPipelineStage !== null
exit 0
