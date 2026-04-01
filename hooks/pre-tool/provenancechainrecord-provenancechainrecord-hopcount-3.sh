#!/bin/bash
# Invariant: provenanceChainRecord.hopCount === 3
# Entity: ProvenanceChainRecord
# Description: ENT artifacts must have exactly 3 hops — this is the canonical 3-hop chain constraint for ENT artifacts
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hopCount === 3
exit 0
