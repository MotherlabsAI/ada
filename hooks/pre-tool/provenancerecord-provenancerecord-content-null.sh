#!/bin/bash
# Invariant: provenanceRecord.content !== null
# Entity: ProvenanceRecord
# Description: content must not be null — it is the basis for hash derivation and immutability verification
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceRecord.content !== null
exit 0
