#!/bin/bash
# Invariant: gap.componentOrdinal === 3
# Entity: C3AssignmentGap
# Description: this gap is specifically and exclusively at ordinal-3 — any other ordinal is a different gap type
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.componentOrdinal === 3
exit 0
