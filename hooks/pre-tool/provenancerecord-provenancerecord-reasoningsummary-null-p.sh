#!/bin/bash
# Invariant: provenanceRecord.reasoningSummary !== null && provenanceRecord.reasoningSummary.length > 0
# Entity: ProvenanceRecord
# Description: reasoning behind the element must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.reasoningSummary !== null && provenanceRecord.reasoningSummary.length > 0
exit 0
