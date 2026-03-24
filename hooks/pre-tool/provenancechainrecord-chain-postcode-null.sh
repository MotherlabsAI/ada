#!/bin/bash
# Invariant: chain.postcode !== null
# Entity: ProvenanceChainRecord
# Description: the chain itself is a provenance artifact and requires its own postcode for G9
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: chain.postcode !== null
exit 0
