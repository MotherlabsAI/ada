#!/bin/bash
# Invariant: decisionNode.branches !== null && decisionNode.branches.length >= 2
# Entity: DecisionNode
# Description: decision node must have at least two branches
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: decisionNode.branches !== null && decisionNode.branches.length >= 2
exit 0
