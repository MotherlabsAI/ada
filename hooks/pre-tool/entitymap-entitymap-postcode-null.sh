#!/bin/bash
# Invariant: entityMap.postcode !== null
# Entity: EntityMap
# Description: EntityMap must be content-addressed for ENT-stage provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.postcode !== null
exit 0
