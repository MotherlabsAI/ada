#!/bin/bash
# Invariant: processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0
# Entity: ProcessFlow
# Description: process model must contain at least one workflow or state machine
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.workflows.length > 0 || processFlow.stateMachines.length > 0
exit 0
