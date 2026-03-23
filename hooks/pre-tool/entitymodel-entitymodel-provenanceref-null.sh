#!/bin/bash
# Invariant: entityModel.provenanceRef !== null
# Entity: EntityModel
# Description: every entity model must carry a provenance reference
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityModel.provenanceRef !== null
exit 0
