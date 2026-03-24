#!/bin/bash
# Invariant: gap.draftId !== null
# Entity: Gap
# Description: Gap must be bound to a specific DraftIntentGraph — without this, resolution cannot be applied to the correct draft
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.draftId !== null
exit 0
