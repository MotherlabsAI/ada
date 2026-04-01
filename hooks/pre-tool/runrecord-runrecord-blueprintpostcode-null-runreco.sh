#!/bin/bash
# Invariant: runRecord.blueprintPostcode !== null && runRecord.blueprintPostcode.length > 0
# Entity: RunRecord
# Description: every run record must reference the blueprint postcode — this is the primary key for provenance lookups
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.blueprintPostcode !== null && runRecord.blueprintPostcode.length > 0
exit 0
