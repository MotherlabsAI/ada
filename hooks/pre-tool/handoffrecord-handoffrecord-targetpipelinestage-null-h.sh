#!/bin/bash
# Invariant: handoffRecord.targetPipelineStage !== null && handoffRecord.targetPipelineStage.length > 0
# Entity: HandoffRecord
# Description: target stage must be specified so the handoff is routed correctly
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.targetPipelineStage !== null && handoffRecord.targetPipelineStage.length > 0
exit 0
