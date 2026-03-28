#!/bin/bash
# Invariant: hop.hopIndex === 0 || hop.hopIndex === 1 || hop.hopIndex === 2
# Entity: ProvenanceChainHop
# Description: hop index must be one of the three valid positions — any other value is outside the three-hop schema
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.hopIndex === 0 || hop.hopIndex === 1 || hop.hopIndex === 2
exit 0
