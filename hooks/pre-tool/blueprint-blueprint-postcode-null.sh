#!/bin/bash
# Invariant: blueprint.postcode !== null
# Entity: Blueprint
# Description: every blueprint must be content-addressed — the postcode is the root of the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.postcode !== null
exit 0
