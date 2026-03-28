#!/bin/bash
# Invariant: result.postcode !== null && result.postcode.startsWith('ML')
# Entity: ENTStageResult
# Description: the result must carry a valid postcode so downstream stages can reference it in their provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: result.postcode !== null && result.postcode.startsWith('ML')
exit 0
