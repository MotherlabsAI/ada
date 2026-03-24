#!/bin/bash
# Invariant: handoffRecord.postcode !== null
# Entity: HandoffRecord
# Description: Handoff must carry a postcode — it is the provenance boundary between elicitation and compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.postcode !== null
exit 0
