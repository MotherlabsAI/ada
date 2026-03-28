#!/bin/bash
# Invariant: provenanceChainHop.isTraced === false || provenanceChainHop.provenanceRecordPostcode !== null
# Entity: ProvenanceChainHop
# Description: a traced hop must have a provenance postcode; isTraced without a postcode is an unauditable claim
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.isTraced === false || provenanceChainHop.provenanceRecordPostcode !== null
exit 0
