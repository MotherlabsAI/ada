#!/bin/bash
# Invariant: hop.toLabel !== null && hop.toLabel.length > 0
# Entity: ProvenanceChainHop
# Description: a hop without a destination label has no identifiable target in the causal chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.toLabel !== null && hop.toLabel.length > 0
exit 0
