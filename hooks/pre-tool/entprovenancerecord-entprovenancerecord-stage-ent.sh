#!/bin/bash
# Invariant: entProvenanceRecord.stage === 'ENT'
# Entity: ENTProvenanceRecord
# Description: ENT provenance records must be scoped to the ENT stage; cross-stage records must not appear in ENT provenance chains
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.stage === 'ENT'
exit 0
