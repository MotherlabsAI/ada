#!/bin/bash
# Invariant: entStageResult.postcode !== null && entStageResult.postcode.length > 0
# Entity: ENTStageResult
# Description: the result must be addressable via postcode so downstream stages can reference it in their provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entStageResult.postcode !== null && entStageResult.postcode.length > 0
exit 0
