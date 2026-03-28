#!/bin/bash
# Invariant: provenanceChainRecord.hops.length === 3
# Entity: ProvenanceChainRecord
# Description: the hops tuple must contain exactly three entries matching hopCount; structural mismatch invalidates the chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hops.length === 3
exit 0
