#!/bin/bash
# Invariant: blueprint.provenanceIndex !== null
# Entity: Blueprint
# Description: provenance index must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.provenanceIndex !== null
exit 0
