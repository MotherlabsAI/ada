#!/bin/bash
# Invariant: entProvenanceRecord.upstreamPostcodes.length >= 1
# Entity: ENTProvenanceRecord
# Description: at least one upstream postcode must exist — ENT-stage records must trace to an upstream source
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.upstreamPostcodes.length >= 1
exit 0
