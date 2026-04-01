#!/bin/bash
# Invariant: entProvenanceRecord.upstreamPostcodes !== null
# Entity: ENTProvenanceRecord
# Description: upstream postcodes must be present (may be empty for root records); a null array means the provenance chain cannot be traversed upward
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.upstreamPostcodes !== null
exit 0
