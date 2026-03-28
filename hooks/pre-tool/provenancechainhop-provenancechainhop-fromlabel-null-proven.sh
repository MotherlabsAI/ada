#!/bin/bash
# Invariant: provenanceChainHop.fromLabel !== null && provenanceChainHop.fromLabel.length > 0
# Entity: ProvenanceChainHop
# Description: every hop must name its origin; a blank fromLabel makes the hop direction unverifiable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.fromLabel !== null && provenanceChainHop.fromLabel.length > 0
exit 0
