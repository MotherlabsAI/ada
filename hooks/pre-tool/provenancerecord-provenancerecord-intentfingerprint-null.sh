#!/bin/bash
# Invariant: provenanceRecord.intentFingerprint !== null
# Entity: ProvenanceRecord
# Description: provenance must reference the source intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.intentFingerprint !== null
exit 0
