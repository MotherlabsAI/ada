#!/bin/bash
# Invariant: hop.isTraced === true ? hop.provenanceRecordPostcode !== null : true
# Entity: ProvenanceChainHop
# Description: a hop claimed as traced must carry a provenance postcode — a traced hop with null postcode is an unverifiable claim
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.isTraced === true ? hop.provenanceRecordPostcode !== null : true
exit 0
