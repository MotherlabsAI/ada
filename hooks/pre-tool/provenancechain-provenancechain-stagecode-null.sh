#!/bin/bash
# Invariant: provenanceChain.stageCode !== null
# Entity: ProvenanceChain
# Description: stageCode identifies which gate passage created this link and must not be null
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.stageCode !== null
exit 0
