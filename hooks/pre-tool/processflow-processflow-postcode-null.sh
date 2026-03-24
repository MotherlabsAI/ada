#!/bin/bash
# Invariant: processFlow.postcode !== null
# Entity: ProcessFlow
# Description: ProcessFlow must carry a postcode — without it the stage cannot be gated by provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.postcode !== null
exit 0
