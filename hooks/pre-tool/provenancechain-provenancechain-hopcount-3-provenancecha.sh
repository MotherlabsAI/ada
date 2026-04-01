#!/bin/bash
# Invariant: provenanceChain.hopCount === 3 || provenanceChain.stageCode !== 'ENT'
# Entity: ProvenanceChain
# Description: ENT-stage provenance chains must be exactly 3 hops; fewer or more hops indicate a broken or fabricated chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.hopCount === 3 || provenanceChain.stageCode !== 'ENT'
exit 0
