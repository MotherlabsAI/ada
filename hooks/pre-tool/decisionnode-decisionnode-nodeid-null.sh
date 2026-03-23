#!/bin/bash
# Invariant: decisionNode.nodeId !== null
# Entity: DecisionNode
# Description: decision node must have an id
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: decisionNode.nodeId !== null
exit 0
