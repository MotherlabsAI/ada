#!/bin/bash
# Invariant: provenanceGate.toPostcode !== null && provenanceGate.toPostcode.length > 0
# Entity: ProvenanceGate
# Description: toPostcode must be non-null — the gate must reference a valid downstream artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.toPostcode !== null && provenanceGate.toPostcode.length > 0
exit 0
