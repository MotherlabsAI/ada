#!/bin/bash
# Invariant: hop.chainId !== null
# Entity: ProvenanceChainHop
# Description: a hop not bound to a chain ID is an orphaned structural fragment that cannot be validated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.chainId !== null
exit 0
