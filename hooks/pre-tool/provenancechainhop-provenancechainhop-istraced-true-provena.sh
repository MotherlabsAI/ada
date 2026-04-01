#!/bin/bash
# Invariant: provenanceChainHop.isTraced === true ? provenanceChainHop.provenanceRecordPostcode !== null : true
# Entity: ProvenanceChainHop
# Description: traced hops must have a provenanceRecordPostcode — without it the hop cannot be verified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.isTraced === true ? provenanceChainHop.provenanceRecordPostcode !== null : true
exit 0
