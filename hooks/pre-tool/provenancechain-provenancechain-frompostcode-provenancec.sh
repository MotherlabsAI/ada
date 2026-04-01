#!/bin/bash
# Invariant: provenanceChain.fromPostcode !== provenanceChain.toPostcode
# Entity: ProvenanceChain
# Description: a self-referential chain is a cycle and breaks unbroken traceability from Blueprint back to IntentGraph
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.fromPostcode !== provenanceChain.toPostcode
exit 0
