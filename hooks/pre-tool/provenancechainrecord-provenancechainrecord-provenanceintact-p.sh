#!/bin/bash
# Invariant: provenanceChainRecord.provenanceIntact === provenanceChainRecord.hops.every(h => h.isTraced)
# Entity: ProvenanceChainRecord
# Description: provenanceIntact must equal the conjunction of all hop traces; partial trace must not report as intact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.provenanceIntact === provenanceChainRecord.hops.every(h => h.isTraced)
exit 0
