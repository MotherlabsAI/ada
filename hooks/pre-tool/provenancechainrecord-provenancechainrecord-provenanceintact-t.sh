#!/bin/bash
# Invariant: provenanceChainRecord.provenanceIntact === true ? provenanceChainRecord.hops.every(h => h.isTraced) : true
# Entity: ProvenanceChainRecord
# Description: if provenance is declared intact, all three hops must be individually traced; a false hop invalidates the claim and fails G5
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.provenanceIntact === true ? provenanceChainRecord.hops.every(h => h.isTraced) : true
exit 0
