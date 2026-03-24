#!/bin/bash
# Invariant: provenanceGate.fromPostcode !== provenanceGate.toPostcode
# Entity: ProvenanceGate
# Description: a gate must span two distinct stages — from and to must differ
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceGate.fromPostcode !== provenanceGate.toPostcode
exit 0
