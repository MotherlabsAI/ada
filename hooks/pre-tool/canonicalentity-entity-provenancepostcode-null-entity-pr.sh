#!/bin/bash
# Invariant: entity.provenancePostcode !== null && entity.provenancePostcode.length > 0
# Entity: CanonicalEntity
# Description: a canonical entity without a provenance postcode cannot be verified in the three-hop chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entity.provenancePostcode !== null && entity.provenancePostcode.length > 0
exit 0
