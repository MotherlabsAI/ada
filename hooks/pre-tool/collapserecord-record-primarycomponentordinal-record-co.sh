#!/bin/bash
# Invariant: record.primaryComponentOrdinal !== record.collapsedComponentOrdinal
# Entity: CollapseRecord
# Description: the two collapsed components must be at distinct ordinal positions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.primaryComponentOrdinal !== record.collapsedComponentOrdinal
exit 0
