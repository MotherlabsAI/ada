#!/bin/bash
# Invariant: provenanceChainHop.chainId !== null
# Entity: ProvenanceChainHop
# Description: every hop must belong to exactly one ProvenanceChainRecord; a null chainId makes the hop an orphan with no structural parent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.chainId !== null
exit 0
