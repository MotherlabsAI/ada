#!/bin/bash
# Invariant: handoffRecord.targetPipelineStage === 'INT→GOV'
# Entity: HandoffRecord
# Description: handoffs always target the INT stage — any other target stage violates the elicitation-to-compilation boundary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.targetPipelineStage === 'INT→GOV'
exit 0
