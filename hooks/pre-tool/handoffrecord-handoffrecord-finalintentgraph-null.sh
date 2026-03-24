#!/bin/bash
# Invariant: handoffRecord.finalIntentGraph !== null
# Entity: HandoffRecord
# Description: Handoff must carry a final intent graph — a handoff without payload is an empty pipeline entry
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.finalIntentGraph !== null
exit 0
