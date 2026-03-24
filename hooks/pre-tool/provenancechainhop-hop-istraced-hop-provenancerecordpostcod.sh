#!/bin/bash
# Invariant: hop.isTraced === (hop.provenanceRecordPostcode !== null)
# Entity: ProvenanceChainHop
# Description: a hop is traced if and only if it has a ProvenanceRecord postcode — claiming traced without a record, or untraced with a record, is an integrity violation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hop.isTraced === (hop.provenanceRecordPostcode !== null)
exit 0
