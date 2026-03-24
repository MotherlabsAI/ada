#!/bin/bash
# Invariant: provenanceGate.fromPostcode !== null && provenanceGate.fromPostcode.length > 0
# Entity: ProvenanceGate
# Description: Origin postcode must exist — a gate with no origin cannot audit the claim chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.fromPostcode !== null && provenanceGate.fromPostcode.length > 0
exit 0
