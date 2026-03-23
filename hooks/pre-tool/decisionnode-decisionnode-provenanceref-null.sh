#!/bin/bash
# Invariant: decisionNode.provenanceRef !== null
# Entity: DecisionNode
# Description: decision node must be traceable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: decisionNode.provenanceRef !== null
exit 0
