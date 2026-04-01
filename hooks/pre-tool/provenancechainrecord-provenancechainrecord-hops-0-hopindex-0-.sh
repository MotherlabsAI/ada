#!/bin/bash
# Invariant: provenanceChainRecord.hops[0].hopIndex === 0 && provenanceChainRecord.hops[1].hopIndex === 1 && provenanceChainRecord.hops[2].hopIndex === 2
# Entity: ProvenanceChainRecord
# Description: hop indices must be 0, 1, 2 in order — out-of-order hops break chain validation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hops[0].hopIndex === 0 && provenanceChainRecord.hops[1].hopIndex === 1 && provenanceChainRecord.hops[2].hopIndex === 2
exit 0
