#!/bin/bash
# Invariant: provenanceChainHop.chainId !== null && provenanceChainHop.chainId.length > 0
# Entity: ProvenanceChainHop
# Description: without a chainId reference the hop is orphaned and cannot contribute to chain integrity validation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.chainId !== null && provenanceChainHop.chainId.length > 0
exit 0
