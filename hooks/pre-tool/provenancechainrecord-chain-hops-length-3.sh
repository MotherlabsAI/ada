#!/bin/bash
# Invariant: chain.hops.length === 3
# Entity: ProvenanceChainRecord
# Description: hops array must contain exactly 3 entries to match hopCount — array/count desync corrupts integrity evaluation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.hops.length === 3
exit 0
