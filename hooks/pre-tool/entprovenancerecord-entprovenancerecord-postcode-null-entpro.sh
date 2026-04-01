#!/bin/bash
# Invariant: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.length > 0
# Entity: ENTProvenanceRecord
# Description: postcode must be non-null — it is the content-addressed identity of this provenance record
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.length > 0
exit 0
