#!/bin/bash
# Invariant: blueprint.postcode.stage === 'SYN'
# Entity: Blueprint
# Description: blueprint postcode must carry the SYN stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.postcode.stage === 'SYN'
exit 0
