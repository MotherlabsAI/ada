#!/bin/bash
# Invariant: record.stage === 'ENT'
# Entity: ENTProvenanceRecord
# Description: a provenance record for a different stage cannot be used as evidence in an ENT three-hop chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.stage === 'ENT'
exit 0
