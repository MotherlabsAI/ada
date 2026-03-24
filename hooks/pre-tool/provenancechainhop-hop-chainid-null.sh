#!/bin/bash
# Invariant: hop.chainId !== null
# Entity: ProvenanceChainHop
# Description: every hop must belong to a ProvenanceChainRecord — orphaned hops cannot contribute to provenanceIntact evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.chainId !== null
exit 0
