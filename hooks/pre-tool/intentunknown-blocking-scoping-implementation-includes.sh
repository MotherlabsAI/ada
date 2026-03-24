#!/bin/bash
# Invariant: ["blocking","scoping","implementation"].includes(intentUnknown.impact)
# Entity: IntentUnknown
# Description: Impact must be classified — the Governor uses this to decide if unresolved unknowns are gate-blocking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["blocking","scoping","implementation"].includes(intentUnknown.impact)
exit 0
