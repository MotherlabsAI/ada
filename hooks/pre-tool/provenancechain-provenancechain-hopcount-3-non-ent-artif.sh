#!/bin/bash
# Invariant: provenanceChain.hopCount === 3 || /* non-ENT artifact */provenanceChain.stageCode !== 'ENT'
# Entity: ProvenanceChain
# Description: ENT-stage artifacts must have exactly 3 hops in their provenance chain — this is the canonical ENT traceability constraint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.hopCount === 3 || /* non-ENT artifact */provenanceChain.stageCode !== 'ENT'
exit 0
