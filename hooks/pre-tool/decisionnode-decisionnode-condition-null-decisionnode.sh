#!/bin/bash
# Invariant: decisionNode.condition !== null && decisionNode.condition.length > 0
# Entity: DecisionNode
# Description: decision must have a condition expression
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: decisionNode.condition !== null && decisionNode.condition.length > 0
exit 0
