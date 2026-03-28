#!/bin/bash
# Invariant: entProvenanceRecord.stage === 'ENT'
# Entity: ENTProvenanceRecord
# Description: records at the ENT stage must declare ENT; a wrong stage label corrupts cross-stage chain validation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entProvenanceRecord.stage === 'ENT'
exit 0
