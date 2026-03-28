#!/bin/bash
# Invariant: provenanceChainRecord.hops[0].hopIndex === 0 && provenanceChainRecord.hops[1].hopIndex === 1 && provenanceChainRecord.hops[2].hopIndex === 2
# Entity: ProvenanceChainRecord
# Description: hops must be in sequential order 0-1-2; out-of-order hops break the directed provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hops[0].hopIndex === 0 && provenanceChainRecord.hops[1].hopIndex === 1 && provenanceChainRecord.hops[2].hopIndex === 2
exit 0
