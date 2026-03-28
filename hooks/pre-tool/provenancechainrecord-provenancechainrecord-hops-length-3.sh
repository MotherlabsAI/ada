#!/bin/bash
# Invariant: provenanceChainRecord.hops.length === 3
# Entity: ProvenanceChainRecord
# Description: the hops tuple must have exactly 3 elements; a mismatch with hopCount=3 means the record is internally inconsistent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hops.length === 3
exit 0
