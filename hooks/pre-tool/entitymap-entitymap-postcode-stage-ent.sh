#!/bin/bash
# Invariant: entityMap.postcode.stage === 'ENT'
# Entity: EntityMap
# Description: entity map postcode must carry the ENT stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.postcode.stage === 'ENT'
exit 0
