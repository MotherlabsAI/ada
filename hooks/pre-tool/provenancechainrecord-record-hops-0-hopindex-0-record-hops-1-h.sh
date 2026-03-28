#!/bin/bash
# Invariant: record.hops[0].hopIndex === 0 && record.hops[1].hopIndex === 1 && record.hops[2].hopIndex === 2
# Entity: ProvenanceChainRecord
# Description: hops must appear in strict index order 0, 1, 2 — out-of-order hops corrupt the causal chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.hops[0].hopIndex === 0 && record.hops[1].hopIndex === 1 && record.hops[2].hopIndex === 2
exit 0
