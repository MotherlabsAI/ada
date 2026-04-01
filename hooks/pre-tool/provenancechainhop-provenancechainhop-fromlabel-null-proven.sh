#!/bin/bash
# Invariant: provenanceChainHop.fromLabel !== null && provenanceChainHop.toLabel !== null
# Entity: ProvenanceChainHop
# Description: both labels must be non-null — unnamed hops cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.fromLabel !== null && provenanceChainHop.toLabel !== null
exit 0
