#!/bin/bash
# Invariant: entEntityMap.postcode !== null && entEntityMap.postcode.length > 0
# Entity: ENTEntityMap
# Description: the EntityMap needs a postcode so ENTGateRecord can reference it during provenance verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entEntityMap.postcode !== null && entEntityMap.postcode.length > 0
exit 0
