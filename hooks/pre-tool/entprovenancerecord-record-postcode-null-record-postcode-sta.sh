#!/bin/bash
# Invariant: record.postcode !== null && record.postcode.startsWith('ML')
# Entity: ENTProvenanceRecord
# Description: ENT provenance records must carry a valid ML-prefixed postcode to participate in the chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.postcode !== null && record.postcode.startsWith('ML')
exit 0
