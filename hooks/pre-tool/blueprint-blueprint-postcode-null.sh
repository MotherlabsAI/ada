#!/bin/bash
# Invariant: blueprint.postcode !== null
# Entity: Blueprint
# Description: Blueprint must carry a postcode — it is the canonical typed artifact of compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.postcode !== null
exit 0
