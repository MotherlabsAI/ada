#!/bin/bash
# Invariant: provenanceGate.fromPostcode !== null && provenanceGate.toPostcode !== null
# Entity: ProvenanceGate
# Description: a gate with null postcodes cannot link pipeline stages in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.fromPostcode !== null && provenanceGate.toPostcode !== null
exit 0
