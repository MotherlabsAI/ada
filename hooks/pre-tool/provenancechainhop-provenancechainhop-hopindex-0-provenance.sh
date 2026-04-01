#!/bin/bash
# Invariant: provenanceChainHop.hopIndex >= 0 && provenanceChainHop.hopIndex <= 2
# Entity: ProvenanceChainHop
# Description: hopIndex must be 0, 1, or 2 — only 3 hops exist in the ENT provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.hopIndex >= 0 && provenanceChainHop.hopIndex <= 2
exit 0
