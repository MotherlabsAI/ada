#!/bin/bash
# Invariant: provenanceChainRecord.provenanceIntact === provenanceChainRecord.hops.every(h => h.isTraced)
# Entity: ProvenanceChainRecord
# Description: provenanceIntact must be true only when all 3 hops are individually traced
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.provenanceIntact === provenanceChainRecord.hops.every(h => h.isTraced)
exit 0
