#!/bin/bash
# Invariant: ["blocking","scoping","implementation"].includes(clarificationRequest.impact)
# Entity: ClarificationRequest
# Description: Impact must match the source IntentUnknown impact classification — it must be consistent to preserve traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["blocking","scoping","implementation"].includes(clarificationRequest.impact)
exit 0
