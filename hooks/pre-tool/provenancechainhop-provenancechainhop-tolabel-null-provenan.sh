#!/bin/bash
# Invariant: provenanceChainHop.toLabel !== null && provenanceChainHop.toLabel.length > 0
# Entity: ProvenanceChainHop
# Description: an empty toLabel means the hop's destination is unknown and the chain cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.toLabel !== null && provenanceChainHop.toLabel.length > 0
exit 0
