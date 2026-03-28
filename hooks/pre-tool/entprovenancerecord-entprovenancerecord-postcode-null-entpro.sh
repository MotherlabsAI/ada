#!/bin/bash
# Invariant: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.startsWith('ML.')
# Entity: ENTProvenanceRecord
# Description: postcodes must use the ML namespace prefix matching PostcodeAddress.prefix; non-ML postcodes are from a different pipeline and corrupt ENT chain verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.postcode !== null && entProvenanceRecord.postcode.startsWith('ML.')
exit 0
