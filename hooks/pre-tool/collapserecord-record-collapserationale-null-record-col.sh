#!/bin/bash
# Invariant: record.collapseRationale !== null && record.collapseRationale.length > 0
# Entity: CollapseRecord
# Description: collapse without a recorded rationale is an undocumented structural decision that cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.collapseRationale !== null && record.collapseRationale.length > 0
exit 0
