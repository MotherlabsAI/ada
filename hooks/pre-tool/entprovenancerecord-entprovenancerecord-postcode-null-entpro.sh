#!/bin/bash
# Invariant: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.length > 0
# Entity: ENTProvenanceRecord
# Description: without a postcode no ProvenanceChainHop can reference this record and the chain is broken
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.length > 0
exit 0
