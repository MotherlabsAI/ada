#!/bin/bash
# Invariant: record.upstreamPostcodes !== null
# Entity: ENTProvenanceRecord
# Description: upstream postcodes may be empty for genesis records but must not be null — null breaks chain-of-custody linkage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.upstreamPostcodes !== null
exit 0
