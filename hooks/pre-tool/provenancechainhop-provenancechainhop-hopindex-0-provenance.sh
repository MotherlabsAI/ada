#!/bin/bash
# Invariant: provenanceChainHop.hopIndex === 0 || provenanceChainHop.hopIndex === 1 || provenanceChainHop.hopIndex === 2
# Entity: ProvenanceChainHop
# Description: hop indices must be exactly 0, 1, or 2; any other index means the hop is outside the three-hop structure and the chain is malformed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.hopIndex === 0 || provenanceChainHop.hopIndex === 1 || provenanceChainHop.hopIndex === 2
exit 0
