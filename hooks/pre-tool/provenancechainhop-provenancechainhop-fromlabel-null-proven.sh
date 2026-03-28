#!/bin/bash
# Invariant: provenanceChainHop.fromLabel !== null && provenanceChainHop.fromLabel.length > 0
# Entity: ProvenanceChainHop
# Description: an empty fromLabel means the hop's source is unknown and the chain cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainHop.fromLabel !== null && provenanceChainHop.fromLabel.length > 0
exit 0
