#!/bin/bash
# Invariant: provenanceChainHop.toLabel !== null && provenanceChainHop.toLabel.length > 0
# Entity: ProvenanceChainHop
# Description: every hop must name its destination; a blank toLabel makes the hop direction unverifiable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.toLabel !== null && provenanceChainHop.toLabel.length > 0
exit 0
