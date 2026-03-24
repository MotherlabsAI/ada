#!/bin/bash
# Invariant: processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0
# Entity: ProcessFlow
# Description: ProcessFlow must contain at least one workflow or state machine — an empty flow has no behavioral model to synthesize from
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0
exit 0
