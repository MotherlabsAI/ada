#!/bin/bash
# Invariant: handoffRecord.postcode !== null
# Entity: HandoffRecord
# Description: the handoff artifact must be content-addressed — the postcode is the provenance root for the entire compilation run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.postcode !== null
exit 0
