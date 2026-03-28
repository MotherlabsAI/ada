#!/bin/bash
# Invariant: provenanceChainRecord.hopCount === 3
# Entity: ProvenanceChainRecord
# Description: any hop count other than 3 is a validation failure by domain definition; this invariant is the primary guard for G4
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.hopCount === 3
exit 0
