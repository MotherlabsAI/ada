#!/bin/bash
# Invariant: record.recordId !== null && record.recordId.length > 0
# Entity: ENTProvenanceRecord
# Description: a record without an ID cannot be referenced by a ProvenanceChainHop
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: record.recordId !== null && record.recordId.length > 0
exit 0
