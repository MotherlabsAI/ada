#!/bin/bash
# Invariant: processFlow.processFlowId !== null
# Entity: ProcessFlow
# Description: flow must have a unique identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.processFlowId !== null
exit 0
