#!/bin/bash
# Invariant: entProvenanceRecord.stage === 'ENT'
# Entity: ENTProvenanceRecord
# Description: stage must be ENT — these records are specific to the ENT stage audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.stage === 'ENT'
exit 0
