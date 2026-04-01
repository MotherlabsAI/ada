#!/bin/bash
# Invariant: provenanceChain.toPostcode !== null && provenanceChain.toPostcode.length > 0
# Entity: ProvenanceChain
# Description: downstream postcode must be non-null — a chain with no destination provides no traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.toPostcode !== null && provenanceChain.toPostcode.length > 0
exit 0
