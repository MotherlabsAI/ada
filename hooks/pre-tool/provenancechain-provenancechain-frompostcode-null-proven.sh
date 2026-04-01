#!/bin/bash
# Invariant: provenanceChain.fromPostcode !== null && provenanceChain.toPostcode !== null
# Entity: ProvenanceChain
# Description: both ends of every chain link must be non-null — a dangling reference breaks traceability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.fromPostcode !== null && provenanceChain.toPostcode !== null
exit 0
