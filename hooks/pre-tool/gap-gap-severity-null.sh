#!/bin/bash
# Invariant: gap.severity !== null
# Entity: Gap
# Description: gap severity must be set — unseveritized gaps cannot be prioritized in the elicitation queue
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.severity !== null
exit 0
