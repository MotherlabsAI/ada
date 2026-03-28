#!/bin/bash
# Invariant: map.postcode !== null && map.postcode.length > 0
# Entity: ENTEntityMap
# Description: the EntityMap must have a postcode so downstream stages can reference it in provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: map.postcode !== null && map.postcode.length > 0
exit 0
