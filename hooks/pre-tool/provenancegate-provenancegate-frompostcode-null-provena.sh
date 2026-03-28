#!/bin/bash
# Invariant: provenanceGate.fromPostcode !== null && provenanceGate.fromPostcode.length > 0
# Entity: ProvenanceGate
# Description: a gate without a source postcode cannot be placed in a chain and its entropy estimate is unanchored
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.fromPostcode !== null && provenanceGate.fromPostcode.length > 0
exit 0
