#!/bin/bash
# Invariant: gap.targetField !== null && gap.targetField.length > 0
# Entity: Gap
# Description: Gap must identify which field is deficient — without this, Ada cannot emit a targeted ClarificationRequest
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.targetField !== null && gap.targetField.length > 0
exit 0
