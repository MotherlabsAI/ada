#!/bin/bash
# Invariant: provenanceChainRecord.componentId !== null && provenanceChainRecord.componentId.length > 0
# Entity: ProvenanceChainRecord
# Description: each chain must be anchored to a specific component; an unanchored chain cannot be matched against the registry
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChainRecord.componentId !== null && provenanceChainRecord.componentId.length > 0
exit 0
