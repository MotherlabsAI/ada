#!/bin/bash
# Invariant: gap.draftId !== null && gap.draftId.length > 0
# Entity: Gap
# Description: Gap must reference a draft — a gap without a draft has no elicitation context
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.draftId !== null && gap.draftId.length > 0
exit 0
