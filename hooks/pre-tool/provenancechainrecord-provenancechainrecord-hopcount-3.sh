#!/bin/bash
# Invariant: provenanceChainRecord.hopCount === 3
# Entity: ProvenanceChainRecord
# Description: G5 explicitly requires three-hop chains; a chain with fewer hops does not satisfy the three-hop validation requirement
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hopCount === 3
exit 0
