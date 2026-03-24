#!/bin/bash
# Invariant: provenanceRecord.postcode !== null && provenanceRecord.postcode.length > 0
# Entity: ProvenanceRecord
# Description: Every provenance record must have a postcode — without it the record cannot be referenced in audit chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.postcode !== null && provenanceRecord.postcode.length > 0
exit 0
