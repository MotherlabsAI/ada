#!/bin/bash
# Invariant: provenanceRecord.stage !== null
# Entity: ProvenanceRecord
# Description: Stage must be identified — without this, the record cannot be placed in the pipeline sequence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.stage !== null
exit 0
