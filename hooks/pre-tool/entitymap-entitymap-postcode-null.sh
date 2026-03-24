#!/bin/bash
# Invariant: entityMap.postcode !== null
# Entity: EntityMap
# Description: EntityMap must carry a postcode — it is a typed pipeline artifact requiring provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.postcode !== null
exit 0
