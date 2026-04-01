#!/bin/bash
# Invariant: provenanceChainRecord.hops.every(h => h.isTraced === true) === provenanceChainRecord.provenanceIntact
# Entity: ProvenanceChainRecord
# Description: provenance is intact if and only if all 3 hops are traced — a single untraced hop breaks the chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hops.every(h => h.isTraced === true) === provenanceChainRecord.provenanceIntact
exit 0
