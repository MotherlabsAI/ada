#!/bin/bash
# Invariant: gap.severity !== null
# Entity: Gap
# Description: Gap severity must be classified — unseveritized gaps cannot gate compilation readiness assessment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.severity !== null
exit 0
